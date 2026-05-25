import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type {
    ChatCompletionMessageParam,
    ChatCompletionToolMessageParam,
} from 'openai/resources/chat/completions';

@Injectable()
export class OpenAiService {
    private readonly client: OpenAI | null;
    private readonly model: string;

    constructor(private readonly configService: ConfigService) {
        const apiKey = this.configService.get<string>('OPENAI_API_KEY');
        this.client = apiKey ? new OpenAI({ apiKey }) : null;
        this.model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    }

    ensureConfigured() {
        if (!this.client) {
            throw new ServiceUnavailableException(
                'El asistente no está configurado. Falta OPENAI_API_KEY en el servidor.',
            );
        }
        return this.client;
    }

    async chat(params: {
        messages: ChatCompletionMessageParam[];
        tools: OpenAI.Chat.Completions.ChatCompletionTool[];
    }) {
        const client = this.ensureConfigured();
        return client.chat.completions.create({
            model: this.model,
            messages: params.messages,
            tools: params.tools,
            tool_choice: 'auto',
        });
    }
}

export type { ChatCompletionMessageParam, ChatCompletionToolMessageParam };
