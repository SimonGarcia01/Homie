import { BadRequestException, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

import { AssistantContextService } from './assistant-context.service';
import { AssistantSessionService } from './assistant-session.service';
import { ChatRequestDto } from './dto/chat.dto';
import { OpenAiService } from './llm/openai.service';
import {
    buildVerifiedPortfolioBlock,
    isPortfolioCountQuery,
    wantsAssignedPropertiesOnly,
} from './portfolio-query.util';
import { buildSystemPrompt } from './prompts/build-system-prompt';
import { ASSISTANT_TOOLS, type AssistantPropertyPreview, type AssistantToolName } from './tools/tool-registry';
import { ToolExecutor, type ToolContext } from './tools/property.tools';

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
        this.maxToolRounds = Number(configService.get<string>('ASSISTANT_MAX_TOOL_ROUNDS', '8'));
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
            sessionId,
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
        const verifiedPortfolioBlock = await this.maybePrefetchPortfolio(userMessage, ctx);
        const systemContent = buildSystemPrompt(contextBlock, verifiedPortfolioBlock);

        const messages: ChatCompletionMessageParam[] = [
            { role: 'system', content: systemContent },
            ...session.messages,
        ];

        const toolsUsed: string[] = [];
        let preview: AssistantPropertyPreview | null = null;
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
                        preview,
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

                    if (name === 'preparar_propiedad' && this.isPreviewResult(result)) {
                        preview = result.vistaPrevia;
                    }

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
                preview,
                toolsUsed,
                usage,
            };
        } catch (err) {
            const message =
                err instanceof HttpException
                    ? (typeof err.getResponse() === 'string'
                          ? err.getResponse()
                          : ((err.getResponse() as { message?: string }).message ?? err.message))
                    : 'No pude consultar tu portafolio. Intenta de nuevo en unos segundos.';

            return {
                sessionId,
                message: typeof message === 'string' ? message : 'No pude consultar tu portafolio. Intenta de nuevo.',
                preview,
                toolsUsed,
                usage,
            };
        }
    }

    private isPreviewResult(value: unknown): value is { vistaPrevia: AssistantPropertyPreview } {
        return (
            typeof value === 'object' &&
            value !== null &&
            'vistaPrevia' in value &&
            typeof (value as { vistaPrevia: unknown }).vistaPrevia === 'object'
        );
    }

    private async maybePrefetchPortfolio(userMessage: string, ctx: ToolContext): Promise<string | null> {
        if (!isPortfolioCountQuery(userMessage)) return null;

        const assignedToMe = wantsAssignedPropertiesOnly(userMessage);
        const countResult = await this.toolExecutor.execute('contar_propiedades', { assignedToMe }, ctx);
        const stats = await this.toolExecutor.execute('estadisticas_portafolio', { assignedToMe }, ctx);

        let listResult: unknown;
        const count =
            typeof countResult === 'object' && countResult !== null && 'count' in countResult
                ? Number((countResult as { count: number }).count)
                : 0;

        if (count > 0 && count <= 10) {
            listResult = await this.toolExecutor.execute('listar_propiedades', { limite: 10, assignedToMe }, ctx);
        }

        this.contextService.record(
            ctx.organizationId,
            ctx.userId,
            ctx.sessionId,
            'contar_propiedades',
            { assignedToMe, prefetch: true },
            { assignedToMe },
            countResult,
        );

        return buildVerifiedPortfolioBlock(stats, countResult, listResult);
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
