import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import { AssistantContextService } from './assistant-context.service';
import { AssistantSessionService } from './assistant-session.service';
import { ChatRequestDto } from './dto/chat.dto';
import { OpenAiService } from './llm/openai.service';
import { buildSystemPrompt } from './prompts/build-system-prompt';
import { ASSISTANT_TOOLS, type AssistantToolName } from './tools/tool-registry';
import { ToolExecutor } from './tools/property.tools';

type AuthUser = { id: string; email: string; organizationId: string; role: string };

type RateBucket = { count: number; resetAt: number };

@Injectable()
export class AssistantService {
    private readonly maxToolRounds: number;
    private readonly rateLimitPerMin: number;
    private readonly rateBuckets = new Map<string, RateBucket>();

    constructor(
        private readonly openAi: OpenAiService,
        private readonly toolExecutor: ToolExecutor,
        private readonly contextService: AssistantContextService,
        private readonly sessionService: AssistantSessionService,
        configService: ConfigService,
    ) {
        this.maxToolRounds = Number(configService.get<string>('ASSISTANT_MAX_TOOL_ROUNDS', '5'));
        this.rateLimitPerMin = Number(configService.get<string>('ASSISTANT_RATE_LIMIT_PER_MIN', '20'));
    }

    async chat(dto: ChatRequestDto, user: AuthUser) {
        this.assertRateLimit(user.id);

        const sessionId = this.sessionService.resolveSessionId(dto.sessionId);
        const userMessage = this.resolveUserMessage(dto);

        const ctx = {
            userId: user.id,
            organizationId: user.organizationId,
            role: user.role,
            email: user.email,
        };

        if (dto.message?.trim()) {
            this.sessionService.appendUserMessage(sessionId, user.organizationId, user.id, userMessage);
        } else {
            const legacyThread = dto.messages!.map(
                (m) => ({ role: m.role, content: m.content }) as ChatCompletionMessageParam,
            );
            this.sessionService.replaceThread(sessionId, user.organizationId, user.id, legacyThread);
        }

        const session = this.sessionService.getOrCreate(sessionId, user.organizationId, user.id);
        const contextBlock = this.contextService.buildContextBlock(user.organizationId, user.id, sessionId);
        const systemContent = buildSystemPrompt(contextBlock);

        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: systemContent },
            ...session.messages,
        ];

        const toolsUsed: string[] = [];
        let usage = { promptTokens: 0, completionTokens: 0 };

        try {
            for (let round = 0; round < this.maxToolRounds; round++) {
                const completion = await this.openAi.chat({ messages, tools: ASSISTANT_TOOLS });

                usage = {
                    promptTokens: usage.promptTokens + (completion.usage?.prompt_tokens ?? 0),
                    completionTokens: usage.completionTokens + (completion.usage?.completion_tokens ?? 0),
                };

                const choice = completion.choices[0];
                if (!choice?.message) break;

                const assistantMsg = choice.message;
                messages.push(assistantMsg);

                const toolCalls = assistantMsg.tool_calls;
                if (!toolCalls?.length) {
                    this.sessionService.replaceThread(sessionId, user.organizationId, user.id, messages.slice(1));

                    return {
                        sessionId,
                        message: assistantMsg.content?.trim() || 'No tengo una respuesta en este momento.',
                        toolsUsed,
                        usage,
                    };
                }

                for (const call of toolCalls) {
                    if (call.type !== 'function') continue;

                    const name = call.function.name as AssistantToolName;
                    let parsedArgs: Record<string, unknown> = {};
                    try {
                        parsedArgs = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>;
                    } catch {
                        parsedArgs = {};
                    }

                    toolsUsed.push(name);
                    const result = await this.toolExecutor.execute(name, parsedArgs, ctx);

                    this.contextService.record(
                        user.organizationId,
                        user.id,
                        sessionId,
                        name,
                        parsedArgs,
                        parsedArgs,
                        result,
                    );

                    messages.push({
                        role: 'tool',
                        tool_call_id: call.id,
                        content: JSON.stringify(result),
                    });
                }
            }

            this.sessionService.replaceThread(sessionId, user.organizationId, user.id, messages.slice(1));

            return {
                sessionId,
                message: 'No pude completar la consulta. Intenta reformular tu pregunta.',
                toolsUsed,
                usage,
            };
        } catch {
            return {
                sessionId,
                message: 'No pude consultar tu portafolio. Intenta de nuevo en unos segundos.',
                toolsUsed,
                usage,
            };
        }
    }

    private resolveUserMessage(dto: ChatRequestDto): string {
        if (dto.message?.trim()) {
            return dto.message.trim();
        }

        if (dto.messages?.length) {
            const last = dto.messages[dto.messages.length - 1];
            if (last.role !== 'user') {
                throw new BadRequestException('El último mensaje debe ser del usuario.');
            }
            return last.content.trim();
        }

        throw new BadRequestException('Se requiere message o messages.');
    }

    private assertRateLimit(userId: string) {
        const now = Date.now();
        const bucket = this.rateBuckets.get(userId);

        if (!bucket || now >= bucket.resetAt) {
            this.rateBuckets.set(userId, { count: 1, resetAt: now + 60_000 });
            return;
        }

        if (bucket.count >= this.rateLimitPerMin) {
            throw new HttpException(
                'Demasiadas consultas. Espera un momento e intenta de nuevo.',
                HttpStatus.TOO_MANY_REQUESTS,
            );
        }

        bucket.count += 1;
    }
}
