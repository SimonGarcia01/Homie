import { Injectable } from '@nestjs/common';

import { ConversationsService } from '../../conversations/conversations.service';
import { LeadsService } from '../../leads/leads.service';

import type { ToolContext } from './property.tools';
import type { AssistantToolName } from './tool-registry';

const CRM_TOOLS = new Set<AssistantToolName>(['buscar_lead', 'obtener_hilo_lead', 'resumir_conversacion_lead']);

@Injectable()
export class CrmTools {
    constructor(
        private readonly leadsService: LeadsService,
        private readonly conversationsService: ConversationsService,
    ) {}

    canHandle(name: AssistantToolName): boolean {
        return CRM_TOOLS.has(name);
    }

    async execute(name: AssistantToolName, args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
        switch (name) {
            case 'buscar_lead':
                return this.buscarLead(args as { busqueda?: string; limite?: number }, ctx);
            case 'obtener_hilo_lead':
            case 'resumir_conversacion_lead':
                return this.obtenerHiloLead(args as { leadId?: string; nombreLead?: string; limite?: number }, ctx, name);
            default:
                throw new Error(`Herramienta CRM desconocida: ${name}`);
        }
    }

    private async buscarLead(args: { busqueda?: string; limite?: number }, ctx: ToolContext) {
        const busqueda = args.busqueda?.trim();
        if (!busqueda) {
            return { error: 'Indica nombre, email o teléfono para buscar el lead.' };
        }

        const limite = Math.min(Math.max(args.limite ?? 8, 1), 20);
        const rows = await this.leadsService.search(ctx.organizationId, busqueda, limite);

        return {
            total: rows.length,
            leads: rows.map((lead) => ({
                id: lead.id,
                nombre: lead.name,
                email: lead.email,
                telefono: lead.phone,
                etapa: lead.stage,
                propiedad: lead.propertyTitle ?? null,
            })),
        };
    }

    private async obtenerHiloLead(
        args: { leadId?: string; nombreLead?: string; limite?: number },
        ctx: ToolContext,
        toolName: AssistantToolName,
    ) {
        let leadId = args.leadId?.trim();

        if (!leadId && args.nombreLead?.trim()) {
            const matches = await this.leadsService.search(ctx.organizationId, args.nombreLead.trim(), 5);
            if (matches.length === 0) {
                return { error: `No encontré leads que coincidan con "${args.nombreLead}".` };
            }
            if (matches.length > 1) {
                return {
                    error: 'Hay varios leads con ese nombre. Pide aclaración o usa leadId.',
                    candidatos: matches.map((lead) => ({
                        id: lead.id,
                        nombre: lead.name,
                        propiedad: lead.propertyTitle ?? null,
                    })),
                };
            }
            leadId = matches[0].id;
        }

        if (!leadId) {
            return { error: 'Indica leadId o nombreLead para obtener el hilo.' };
        }

        const limite = Math.min(Math.max(args.limite ?? 50, 1), 100);
        const context = await this.conversationsService.getThreadContext(ctx.organizationId, leadId, limite);

        if (toolName === 'resumir_conversacion_lead') {
            return {
                ...context,
                instruccion:
                    'Resume este hilo en español: puntos clave, interés del lead, objeciones, próximo paso sugerido. Si no hay mensajes, indícalo.',
            };
        }

        return context;
    }
}
