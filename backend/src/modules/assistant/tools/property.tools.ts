import { Injectable, NotFoundException } from '@nestjs/common';

import {
    parseCommercialStatus,
    parsePropertyType,
    parsePublicationStatus,
    roleToEs,
} from '../../../common/domain-labels';
import { PropertiesService } from '../../properties/properties.service';
import { UsersService } from '../../users/users.service';
import type { AssistantToolName } from './tool-registry';

export type ToolContext = {
    userId: string;
    organizationId: string;
    role: string;
    email: string;
    sessionId: string;
};

type FilterArgs = {
    tipo?: string;
    estadoComercial?: string;
    estadoPublicacion?: string;
    ciudad?: string;
    pais?: string;
    arriendoMinimo?: number;
    arriendoMaximo?: number;
    busqueda?: string;
    assignedToMe?: boolean;
    limite?: number;
};

@Injectable()
export class PropertyTools {
    constructor(
        private readonly propertiesService: PropertiesService,
        private readonly usersService: UsersService,
    ) {}

    async execute(name: AssistantToolName, args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
        switch (name) {
            case 'contar_propiedades':
                return this.contarPropiedades(args as FilterArgs, ctx);
            case 'listar_propiedades':
                return this.listarPropiedades(args as FilterArgs, ctx);
            case 'obtener_propiedad':
                return this.obtenerPropiedad(args as { id?: string; codigo?: string; busqueda?: string }, ctx);
            case 'estadisticas_portafolio':
                return this.estadisticasPortafolio(args as { assignedToMe?: boolean }, ctx);
            case 'contexto_usuario':
                return this.contextoUsuario(ctx);
            default:
                throw new Error(`Herramienta desconocida: ${name}`);
        }
    }

    private buildFilters(args: FilterArgs) {
        return {
            propertyType: parsePropertyType(args.tipo),
            commercialStatus: parseCommercialStatus(args.estadoComercial),
            publicationStatus: parsePublicationStatus(args.estadoPublicacion),
            city: args.ciudad,
            country: args.pais,
            minRent: args.arriendoMinimo,
            maxRent: args.arriendoMaximo,
            q: args.busqueda,
            assignedToMe: args.assignedToMe,
        };
    }

    private async contarPropiedades(args: FilterArgs, ctx: ToolContext) {
        const filters = this.buildFilters(args);
        const countResult = await this.propertiesService.search(ctx.organizationId, ctx.userId, {
            ...filters,
            countOnly: true,
        });
        const count = countResult.count ?? 0;

        if (count >= 1 && count <= 3) {
            const list = await this.propertiesService.search(ctx.organizationId, ctx.userId, {
                ...filters,
                limit: 3,
                page: 1,
            });
            return {
                count,
                propiedades: 'items' in list ? list.items : [],
                nota: 'Se incluye detalle porque hay 3 o menos coincidencias.',
            };
        }

        return { count };
    }

    private async listarPropiedades(args: FilterArgs, ctx: ToolContext) {
        const limit = Math.min(Math.max(args.limite ?? 20, 1), 20);
        return this.propertiesService.search(ctx.organizationId, ctx.userId, {
            ...this.buildFilters(args),
            limit,
            page: 1,
        });
    }

    private async obtenerPropiedad(
        args: { id?: string; codigo?: string; busqueda?: string },
        ctx: ToolContext,
    ) {
        if (args.id) {
            try {
                return await this.propertiesService.findSummary(args.id, ctx.organizationId);
            } catch (e) {
                if (!(e instanceof NotFoundException)) throw e;
            }
        }

        const q = args.codigo ?? args.busqueda;
        if (!q) {
            return { error: 'Se requiere id, codigo o busqueda' };
        }

        const result = await this.propertiesService.search(ctx.organizationId, ctx.userId, {
            q,
            limit: 5,
            page: 1,
        });

        if ('items' in result && result.items && result.items.length === 1) {
            return result.items[0];
        }

        return result;
    }

    private async estadisticasPortafolio(args: { assignedToMe?: boolean }, ctx: ToolContext) {
        return this.propertiesService.getStats(ctx.organizationId, ctx.userId, {
            assignedToMe: args.assignedToMe,
        });
    }

    private async contextoUsuario(ctx: ToolContext) {
        const user = await this.usersService.findOne(ctx.userId);
        return {
            nombre: `${user.firstName} ${user.lastName}`.trim(),
            email: ctx.email,
            rol: roleToEs(ctx.role),
            esAgente: ctx.role === 'agent',
            organizationId: ctx.organizationId,
        };
    }
}

import { PropertyWriteTools } from './property-write.tools';

@Injectable()
export class ToolExecutor {
    constructor(
        private readonly propertyTools: PropertyTools,
        private readonly writeTools: PropertyWriteTools,
    ) {}

    execute(name: AssistantToolName, args: Record<string, unknown>, ctx: ToolContext) {
        if (this.writeTools.canHandle(name)) {
            return this.writeTools.execute(name, args, ctx);
        }
        return this.propertyTools.execute(name, args, ctx);
    }
}
