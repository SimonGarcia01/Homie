import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { CreatePropertyDto } from '../properties/dto/create-property.dto';

export type PropertyDraftPreview = {
    titulo: string;
    tipo: string;
    propietario: string;
    propietarioId: string;
    arriendoMensual: number;
    moneda: string;
    ciudad: string;
    pais: string;
    direccion: string | null;
    dormitorios: number;
    banos: number;
    estadoComercial: string;
    estadoPublicacion: string;
    codigoPropuesto: string;
    descripcion: string | null;
};

export type PropertyDraft = {
    organizationId: string;
    userId: string;
    sessionId: string;
    dto: CreatePropertyDto;
    preview: PropertyDraftPreview;
    expiresAt: number;
};

@Injectable()
export class AssistantDraftService {
    private readonly ttlMs: number;
    private readonly store = new Map<string, PropertyDraft>();

    constructor(configService: ConfigService) {
        const ttlMin = Number(configService.get<string>('ASSISTANT_DRAFT_TTL_MIN', '30'));
        this.ttlMs = ttlMin * 60_000;
    }

    private key(organizationId: string, userId: string, sessionId: string) {
        return `${organizationId}:${userId}:${sessionId}`;
    }

    save(organizationId: string, userId: string, sessionId: string, dto: CreatePropertyDto, preview: PropertyDraftPreview) {
        this.pruneExpired();
        const entry: PropertyDraft = {
            organizationId,
            userId,
            sessionId,
            dto,
            preview,
            expiresAt: Date.now() + this.ttlMs,
        };
        this.store.set(this.key(organizationId, userId, sessionId), entry);
        return entry;
    }

    get(organizationId: string, userId: string, sessionId: string): PropertyDraft | null {
        this.pruneExpired();
        const entry = this.store.get(this.key(organizationId, userId, sessionId));
        if (!entry || Date.now() > entry.expiresAt) {
            this.store.delete(this.key(organizationId, userId, sessionId));
            return null;
        }
        return entry;
    }

    clear(organizationId: string, userId: string, sessionId: string) {
        this.store.delete(this.key(organizationId, userId, sessionId));
    }

    private pruneExpired() {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
            if (now > entry.expiresAt) this.store.delete(key);
        }
    }
}
