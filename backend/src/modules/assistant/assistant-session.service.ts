import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export type AssistantSession = {
    sessionId: string;
    organizationId: string;
    userId: string;
    expiresAt: number;
    messages: ChatCompletionMessageParam[];
};

@Injectable()
export class AssistantSessionService {
    private readonly ttlMs: number;
    private readonly store = new Map<string, AssistantSession>();

    constructor(configService: ConfigService) {
        const ttlMin = Number(configService.get<string>('ASSISTANT_SESSION_TTL_MIN', '30'));
        this.ttlMs = ttlMin * 60_000;
    }

    resolveSessionId(provided?: string): string {
        this.pruneExpired();
        if (provided?.trim()) return provided.trim();
        return randomUUID();
    }

    get(sessionId: string, organizationId: string, userId: string): AssistantSession | null {
        this.pruneExpired();
        const session = this.store.get(sessionId);
        if (!session) return null;
        if (session.organizationId !== organizationId || session.userId !== userId) {
            throw new ForbiddenException('Sesión de asistente no válida.');
        }
        if (Date.now() > session.expiresAt) {
            this.store.delete(sessionId);
            return null;
        }
        return session;
    }

    getOrCreate(sessionId: string, organizationId: string, userId: string): AssistantSession {
        const existing = this.get(sessionId, organizationId, userId);
        if (existing) return existing;

        const session: AssistantSession = {
            sessionId,
            organizationId,
            userId,
            expiresAt: Date.now() + this.ttlMs,
            messages: [],
        };
        this.store.set(sessionId, session);
        return session;
    }

    appendUserMessage(sessionId: string, organizationId: string, userId: string, content: string) {
        const session = this.getOrCreate(sessionId, organizationId, userId);
        session.messages.push({ role: 'user', content });
        session.expiresAt = Date.now() + this.ttlMs;
        this.store.set(sessionId, session);
        return session;
    }

    replaceThread(
        sessionId: string,
        organizationId: string,
        userId: string,
        messages: ChatCompletionMessageParam[],
    ) {
        const session = this.getOrCreate(sessionId, organizationId, userId);
        session.messages = messages;
        session.expiresAt = Date.now() + this.ttlMs;
        this.store.set(sessionId, session);
        return session;
    }

    assertOwned(sessionId: string, organizationId: string, userId: string) {
        const session = this.get(sessionId, organizationId, userId);
        if (!session) throw new NotFoundException('Sesión expirada o no encontrada. Inicia una nueva conversación.');
        return session;
    }

    clear(sessionId: string, organizationId: string, userId: string) {
        const session = this.get(sessionId, organizationId, userId);
        if (session) {
            session.messages = [];
            session.expiresAt = Date.now() + this.ttlMs;
            this.store.set(sessionId, session);
        }
    }

    private pruneExpired() {
        const now = Date.now();
        for (const [key, session] of this.store.entries()) {
            if (now > session.expiresAt) this.store.delete(key);
        }
    }
}
