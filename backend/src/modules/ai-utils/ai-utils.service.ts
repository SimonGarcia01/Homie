import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { LeadStatus, PropertyCommercialStatus, PropertyType } from '../../common/enums';
import { OpenAiService } from '../assistant/llm/openai.service';
import { ConversationsService } from '../conversations/conversations.service';
import { Lead } from '../leads/entities/lead.entity';
import { Property } from '../properties/entities/property.entity';
import { PropertyFeature } from '../properties/entities/property-feature.entity';
import { PropertyLocation } from '../properties/entities/property-location.entity';
import { PropertyRentalDetail } from '../properties/entities/property-rental-detail.entity';
import { Visit } from '../visits/entities/visit.entity';

const PROPERTY_TYPE_ES: Record<PropertyType, string> = {
    [PropertyType.APARTMENT]: 'departamento',
    [PropertyType.HOUSE]: 'casa',
    [PropertyType.STUDIO]: 'estudio',
    [PropertyType.OFFICE]: 'oficina',
    [PropertyType.WAREHOUSE]: 'bodega',
    [PropertyType.LAND]: 'terreno',
    [PropertyType.OTHER]: 'propiedad',
};

const DOCUMENT_KINDS = ['contrato', 'cedula', 'comprobante', 'garantia', 'otro'] as const;
type DocumentKind = (typeof DOCUMENT_KINDS)[number];

type WeekDigestCache = {
    summary: string;
    generatedAt: string;
    weekLabel: string;
};

@Injectable()
export class AiUtilsService {
    private readonly digestCache = new Map<string, WeekDigestCache>();

    constructor(
        private readonly openAi: OpenAiService,
        private readonly conversationsService: ConversationsService,
        @InjectRepository(Lead)
        private readonly leadsRepo: Repository<Lead>,
        @InjectRepository(Property)
        private readonly propertyRepo: Repository<Property>,
        @InjectRepository(Visit)
        private readonly visitsRepo: Repository<Visit>,
    ) {}

    // ─── 1. Property description ────────────────────────────────────────────
    async generatePropertyDescription(dto: {
        title: string;
        type: string;
        city: string;
        bedrooms: number;
        bathrooms: number;
        rent: number;
        currency: string;
    }): Promise<{ description: string }> {
        const client = this.openAi.ensureConfigured();

        const rentFmt =
            dto.currency === 'CLP'
                ? new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(dto.rent)
                : `${dto.rent} ${dto.currency}`;

        const prompt = `Escribe una descripción atractiva en español para el siguiente aviso de arriendo. 
Usa 2–3 oraciones, tono cálido y profesional, sin puntos de bala, sin markdown.
Datos: tipo=${dto.type}, título="${dto.title}", ciudad=${dto.city}, dormitorios=${dto.bedrooms}, baños=${dto.bathrooms}, arriendo=${rentFmt}.`;

        const result = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 200,
            temperature: 0.7,
        });

        const description = result.choices[0]?.message?.content?.trim() ?? '';
        return { description };
    }

    // ─── 2. Smart reply ─────────────────────────────────────────────────────
    async generateSmartReply(leadId: string, organizationId: string): Promise<{ draft: string }> {
        const client = this.openAi.ensureConfigured();

        const ctx = await this.conversationsService.getThreadContext(organizationId, leadId, 20);

        if (ctx.mensajes.length === 0) {
            return {
                draft: `Hola ${ctx.lead.nombre}, ¡gracias por tu interés! Quedé a tu disposición para responder cualquier consulta.`,
            };
        }

        const threadText = ctx.mensajes
            .map((m) => `[${m.direccion === 'inbound' ? 'Interesado' : 'Broker'}]: ${m.texto}`)
            .join('\n');

        const prompt = `Eres un agente inmobiliario profesional y cercano.
Aquí está el hilo de conversación con ${ctx.lead.nombre} (interesado en ${ctx.lead.propiedad ?? 'una propiedad'}):

${threadText}

Redacta una respuesta breve (1–3 oraciones) en español adecuada al contexto. Solo el texto del mensaje, sin saludos ni firma.`;

        const result = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 150,
            temperature: 0.6,
        });

        const draft = result.choices[0]?.message?.content?.trim() ?? '';
        return { draft };
    }

    // ─── 3. Document classify ────────────────────────────────────────────────
    async classifyDocument(filename: string, mimeType?: string): Promise<{ kind: DocumentKind; confidence: 'high' | 'low' }> {
        const lower = filename.toLowerCase();

        // Pattern matching first (cheap)
        if (/c[eé]dul|rut|dni|identidad|id[\s_-]/i.test(lower)) return { kind: 'cedula', confidence: 'high' };
        if (/contrato|contract|arrendamiento|lease/i.test(lower)) return { kind: 'contrato', confidence: 'high' };
        if (/garant[ií]a|guaranty|aval/i.test(lower)) return { kind: 'garantia', confidence: 'high' };
        if (/comprobante|recibo|boleta|factura|pago|payment|receipt/i.test(lower)) return { kind: 'comprobante', confidence: 'high' };

        // Fallback to LLM
        try {
            const client = this.openAi.ensureConfigured();
            const prompt = `Clasifica el siguiente nombre de archivo en una de estas categorías de documento inmobiliario: contrato, cedula, comprobante, garantia, otro.
Responde SOLO con la palabra de la categoría, sin explicación.
Nombre: "${filename}"${mimeType ? `\nTipo MIME: ${mimeType}` : ''}`;

            const result = await client.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [{ role: 'user', content: prompt }],
                max_tokens: 10,
                temperature: 0,
            });

            const raw = result.choices[0]?.message?.content?.trim().toLowerCase() ?? 'otro';
            const kind: DocumentKind = DOCUMENT_KINDS.includes(raw as DocumentKind) ? (raw as DocumentKind) : 'otro';
            return { kind, confidence: kind === 'otro' ? 'low' : 'high' };
        } catch {
            return { kind: 'otro', confidence: 'low' };
        }
    }

    // ─── 4. Lead scoring ─────────────────────────────────────────────────────
    async batchLeadScores(
        leadIds: string[],
        organizationId: string,
    ): Promise<{ scores: { leadId: string; score: number; signal: 'hot' | 'warm' | 'cold'; reason: string }[] }> {
        if (leadIds.length === 0) return { scores: [] };

        const leads = await this.leadsRepo.find({
            where: { organizationId, id: In(leadIds) },
            relations: { contact: true },
        });

        const now = Date.now();
        const scores = leads.map((lead) => {
            const daysOld = Math.floor((now - lead.createdAt.getTime()) / 86_400_000);

            // Heuristic: freshness + status + temperature
            let score = 5;
            if (daysOld <= 1) score += 3;
            else if (daysOld <= 3) score += 2;
            else if (daysOld <= 7) score += 1;
            else if (daysOld > 30) score -= 2;

            if (lead.status === LeadStatus.CONTACTED) score += 1;

            if (lead.temperature === 'hot') score += 2;
            else if (lead.temperature === 'warm') score += 1;
            else score -= 1;

            const capped = Math.max(1, Math.min(10, score));
            const signal: 'hot' | 'warm' | 'cold' = capped >= 7 ? 'hot' : capped >= 4 ? 'warm' : 'cold';

            const name = `${lead.contact?.firstName ?? ''} ${lead.contact?.lastName ?? ''}`.trim();
            const ageLabel = daysOld === 0 ? 'hoy' : daysOld === 1 ? 'ayer' : `hace ${daysOld} días`;
            const statusLabel = lead.status === LeadStatus.CONTACTED ? 'contactado' : 'nuevo';
            const reason =
                signal === 'hot'
                    ? `Lead ${ageLabel} (${statusLabel}), alta temperatura`
                    : signal === 'warm'
                      ? `Interés moderado, contacto ${ageLabel}`
                      : `Lead inactivo — ${ageLabel}, sin contacto reciente`;

            return { leadId: lead.id, score: capped, signal, reason };
        });

        return { scores };
    }

    // ─── 5. Rent suggestion ──────────────────────────────────────────────────
    async getRentSuggestion(params: {
        tipo: string;
        ciudad: string;
        dormitorios?: number;
        banos?: number;
        organizationId: string;
    }): Promise<{ min: number; max: number; suggested: number; currency: string; basedOn: number } | null> {
        const typeMap: Record<string, PropertyType> = {
            departamento: PropertyType.APARTMENT,
            casa: PropertyType.HOUSE,
            oficina: PropertyType.OFFICE,
            bodega: PropertyType.WAREHOUSE,
            estudio: PropertyType.STUDIO,
        };

        const propertyType = typeMap[params.tipo.toLowerCase()];

        const qb = this.propertyRepo
            .createQueryBuilder('p')
            .leftJoinAndSelect('p.rentalDetail', 'rd')
            .leftJoinAndSelect('p.location', 'loc')
            .leftJoinAndSelect('p.feature', 'feat')
            .where('p.organizationId = :orgId', { orgId: params.organizationId })
            .andWhere('p.commercialStatus = :status', { status: PropertyCommercialStatus.AVAILABLE })
            .andWhere('rd.monthlyRent IS NOT NULL')
            .andWhere('rd.monthlyRent > 0')
            .andWhere('UPPER(loc.city) ILIKE :city', { city: `%${params.ciudad.trim()}%` });

        if (propertyType) {
            qb.andWhere('p.propertyType = :type', { type: propertyType });
        }

        if (params.dormitorios !== undefined) {
            qb.andWhere('feat.bedrooms BETWEEN :minBed AND :maxBed', {
                minBed: Math.max(1, params.dormitorios - 1),
                maxBed: params.dormitorios + 1,
            });
        }

        const properties = await qb.getMany();

        if (properties.length === 0) return null;

        const rents = properties.map((p) => Number.parseFloat(p.rentalDetail?.monthlyRent ?? '0')).filter((r) => r > 0);

        if (rents.length === 0) return null;

        const min = Math.min(...rents);
        const max = Math.max(...rents);
        const suggested = Math.round(rents.reduce((a, b) => a + b, 0) / rents.length);

        return { min, max, suggested, currency: 'CLP', basedOn: rents.length };
    }

    // ─── 6. Weekly digest ────────────────────────────────────────────────────
    async getWeeklyDigest(
        organizationId: string,
        force = false,
    ): Promise<{ summary: string; generatedAt: string; weekLabel: string }> {
        const weekISO = this.currentWeekISO();
        const cacheKey = `${organizationId}:${weekISO}`;

        if (!force && this.digestCache.has(cacheKey)) {
            return this.digestCache.get(cacheKey)!;
        }

        const client = this.openAi.ensureConfigured();

        const weekStart = this.weekStart();
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 7);

        // Gather metrics
        const [newLeads, completedVisits, allVisits] = await Promise.all([
            this.leadsRepo.count({ where: { organizationId } }),
            this.visitsRepo.count({ where: { organizationId } }),
            this.visitsRepo.count({ where: { organizationId } }),
        ]);

        // Leads created this week
        const leadsThisWeek = await this.leadsRepo
            .createQueryBuilder('l')
            .where('l.organizationId = :orgId', { orgId: organizationId })
            .andWhere('l.createdAt >= :weekStart', { weekStart })
            .getCount();

        // Visits this week
        const visitsThisWeek = await this.visitsRepo
            .createQueryBuilder('v')
            .where('v.organizationId = :orgId', { orgId: organizationId })
            .andWhere('v.createdAt >= :weekStart', { weekStart })
            .getCount();

        const d = new Date(weekStart);
        const weekLabel = d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' });

        const prompt = `Eres el asistente de Homie, una plataforma de gestión inmobiliaria de arriendo.
Redacta un resumen ejecutivo semanal en español (3–4 oraciones, tono profesional y motivador).
Semana del ${weekLabel}. Datos clave:
- Leads nuevos esta semana: ${leadsThisWeek}
- Visitas agendadas esta semana: ${visitsThisWeek}
- Leads totales en portafolio: ${newLeads}
- Visitas totales registradas: ${allVisits}
No inventes datos. Si una métrica es 0, menciónalo brevemente y da un consejo de acción.`;

        const result = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 300,
            temperature: 0.5,
        });

        const summary = result.choices[0]?.message?.content?.trim() ?? 'Resumen no disponible.';
        const entry: WeekDigestCache = { summary, generatedAt: new Date().toISOString(), weekLabel };
        this.digestCache.set(cacheKey, entry);

        return entry;
    }

    // ─── 7. Visit briefing ───────────────────────────────────────────────────
    async getVisitBrief(
        visitId: string,
        organizationId: string,
    ): Promise<{ propertyHighlights: string; leadProfile: string; talkingPoints: string[] }> {
        const client = this.openAi.ensureConfigured();

        const visit = await this.visitsRepo.findOne({
            where: { id: visitId, organizationId },
            relations: {
                property: { rentalDetail: true, location: true, feature: true },
                contact: true,
                opportunity: true,
            },
        });

        if (!visit) throw new NotFoundException('Visita no encontrada');

        const p = visit.property;
        const c = visit.contact;
        const leadId = visit.opportunity?.leadId;

        let threadSummary = 'Sin historial de conversación previo.';
        if (leadId) {
            try {
                const ctx = await this.conversationsService.getThreadContext(organizationId, leadId, 10);
                if (ctx.mensajes.length > 0) {
                    threadSummary = ctx.mensajes
                        .slice(-5)
                        .map((m) => `[${m.direccion === 'inbound' ? 'Interesado' : 'Broker'}]: ${m.texto}`)
                        .join('\n');
                }
            } catch {
                // silently skip if no thread
            }
        }

        const propertyStr = p
            ? `${PROPERTY_TYPE_ES[p.propertyType] ?? 'propiedad'} en ${p.location?.city ?? ''}, ${p.location?.address ?? ''}, ${p.feature?.bedrooms ?? 0} dorm, ${p.feature?.bathrooms ?? 0} baños, arriendo ${p.rentalDetail?.monthlyRent ?? '?'} CLP. Descripción: ${p.description ?? 'Sin descripción.'}`
            : 'Propiedad no disponible.';

        const contactStr = c
            ? `${c.firstName} ${c.lastName}`
            : 'Interesado desconocido';

        const prompt = `Eres un asistente de preparación de visitas inmobiliarias. Genera un briefing estructurado en JSON para el broker antes de la visita.

Propiedad: ${propertyStr}
Interesado: ${contactStr}
Últimos mensajes del hilo:
${threadSummary}

Responde SOLO con JSON válido (sin markdown) con esta estructura exacta:
{
  "propertyHighlights": "2-3 puntos clave de la propiedad como texto corrido",
  "leadProfile": "Perfil breve del interesado y lo que busca según el hilo",
  "talkingPoints": ["punto 1", "punto 2", "punto 3"]
}`;

        const result = await client.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            max_tokens: 400,
            temperature: 0.4,
        });

        const raw = result.choices[0]?.message?.content?.trim() ?? '{}';

        try {
            const parsed = JSON.parse(raw) as { propertyHighlights?: string; leadProfile?: string; talkingPoints?: string[] };
            return {
                propertyHighlights: parsed.propertyHighlights ?? 'Sin información disponible.',
                leadProfile: parsed.leadProfile ?? 'Perfil no disponible.',
                talkingPoints: parsed.talkingPoints ?? [],
            };
        } catch {
            return {
                propertyHighlights: 'No se pudo generar el resumen de la propiedad.',
                leadProfile: 'No se pudo analizar el perfil del interesado.',
                talkingPoints: [],
            };
        }
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────
    private weekStart(): Date {
        const d = new Date();
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    private currentWeekISO(): string {
        const d = this.weekStart();
        return `${d.getFullYear()}-W${String(Math.ceil(d.getDate() / 7)).padStart(2, '0')}`;
    }
}
