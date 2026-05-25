import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { PropertySummaryEs } from '../../common/domain-labels';

export type CachedToolEntry = {
    tool: string;
    args: Record<string, unknown>;
    filters: Record<string, unknown>;
    result: unknown;
    recordedAt: number;
};

export type AssistantContextSnapshot = {
    expiresAt: number;
    sessionId?: string;
    recentTools: CachedToolEntry[];
    recentProperties: PropertySummaryEs[];
    lastFilters: Record<string, unknown> | null;
};

const MAX_TOOL_ENTRIES = 8;
const MAX_PROPERTY_ENTRIES = 20;

@Injectable()
export class AssistantContextService {
    private readonly ttlMs: number;
    private readonly store = new Map<string, AssistantContextSnapshot>();

    constructor(configService: ConfigService) {
        const ttlMin = Number(configService.get<string>('ASSISTANT_CONTEXT_TTL_MIN', '30'));
        this.ttlMs = ttlMin * 60_000;
    }

    private cacheKey(organizationId: string, userId: string, sessionId?: string) {
        return sessionId ? `${organizationId}:${userId}:${sessionId}` : `${organizationId}:${userId}`;
    }

    get(organizationId: string, userId: string, sessionId?: string): AssistantContextSnapshot | null {
        this.pruneExpired();
        const key = this.cacheKey(organizationId, userId, sessionId);
        const entry = this.store.get(key);
        if (!entry || Date.now() > entry.expiresAt) {
            this.store.delete(key);
            return null;
        }
        return entry;
    }

    record(
        organizationId: string,
        userId: string,
        sessionId: string | undefined,
        tool: string,
        args: Record<string, unknown>,
        filters: Record<string, unknown>,
        result: unknown,
    ) {
        this.pruneExpired();
        const key = this.cacheKey(organizationId, userId, sessionId);
        const now = Date.now();
        const existing = this.store.get(key);
        const properties = this.extractProperties(result);

        const snapshot: AssistantContextSnapshot = {
            expiresAt: now + this.ttlMs,
            sessionId,
            recentTools: [
                { tool, args, filters, result, recordedAt: now },
                ...(existing?.recentTools ?? []),
            ].slice(0, MAX_TOOL_ENTRIES),
            recentProperties: this.mergeProperties(existing?.recentProperties ?? [], properties),
            lastFilters: Object.keys(filters).length > 0 ? filters : (existing?.lastFilters ?? null),
        };

        this.store.set(key, snapshot);
        return snapshot;
    }

    buildContextBlock(organizationId: string, userId: string, sessionId?: string): string | null {
        const snapshot = this.get(organizationId, userId, sessionId);
        if (!snapshot) return null;

        const parts: string[] = [
            'CONTEXTO RECIENTE (consultas previas en esta conversación; usa esto para follow-ups como "esta", "esa", "la que mencionaste"):',
        ];

        if (snapshot.recentProperties.length > 0) {
            parts.push('Propiedades mencionadas recientemente:');
            snapshot.recentProperties.forEach((p, i) => {
                parts.push(
                    `${i + 1}. id="${p.id}" | código="${p.code}" | título="${p.title}" | ${p.tipo} | ${p.estadoComercial} | ${p.ciudad} | arriendo ${p.arriendoMensual} ${p.moneda}`,
                );
            });
        }

        if (snapshot.lastFilters && Object.keys(snapshot.lastFilters).length > 0) {
            parts.push(`Últimos filtros aplicados: ${JSON.stringify(snapshot.lastFilters)}`);
        }

        const lastTool = snapshot.recentTools[0];
        if (lastTool) {
            parts.push(`Última herramienta: ${lastTool.tool}`);
        }

        if (parts.length <= 1) return null;
        return parts.join('\n');
    }

    private mergeProperties(existing: PropertySummaryEs[], incoming: PropertySummaryEs[]) {
        const byId = new Map<string, PropertySummaryEs>();
        for (const p of [...incoming, ...existing]) {
            byId.set(p.id, p);
        }
        return [...byId.values()].slice(0, MAX_PROPERTY_ENTRIES);
    }

    private extractProperties(result: unknown): PropertySummaryEs[] {
        if (!result || typeof result !== 'object') return [];

        const r = result as Record<string, unknown>;

        if (Array.isArray(r.propiedades)) {
            return r.propiedades.filter((p) => this.isPropertySummary(p)) as PropertySummaryEs[];
        }

        if (Array.isArray(r.items)) {
            return r.items.filter((p) => this.isPropertySummary(p)) as PropertySummaryEs[];
        }

        if (this.isPropertySummary(r)) {
            return [r as PropertySummaryEs];
        }

        return [];
    }

    private isPropertySummary(value: unknown): value is PropertySummaryEs {
        if (!value || typeof value !== 'object') return false;
        const p = value as Record<string, unknown>;
        return typeof p.id === 'string' && typeof p.title === 'string' && typeof p.code === 'string';
    }

    private pruneExpired() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) this.store.delete(key);
        }
    }
}
