import { ForbiddenException, Injectable } from '@nestjs/common';

import {
    commercialStatusToEs,
    parseCommercialStatus,
    parsePropertyType,
    parsePublicationStatus,
    propertyTypeToEs,
    publicationStatusToEs,
    toPropertySummaryEs,
} from '../../../common/domain-labels';
import {
    PropertyCommercialStatus,
    PropertyPublicationStatus,
    PropertyType,
} from '../../../common/enums';
import { CreatePropertyDto } from '../../properties/dto/create-property.dto';
import { PropertiesService } from '../../properties/properties.service';
import { OwnersService } from '../../owners/owners.service';
import { AssistantDraftService, type PropertyDraftPreview } from '../assistant-draft.service';
import type { ToolContext } from './property.tools';
import type { AssistantToolName } from './tool-registry';

const CREATE_PROPERTY_ROLES = new Set(['admin', 'coordinator', 'agent']);

type PrepararPropiedadArgs = {
    titulo?: string;
    tipo?: string;
    propietarioId?: string;
    propietarioNombre?: string;
    arriendoMensual?: number;
    moneda?: string;
    ciudad?: string;
    pais?: string;
    direccion?: string;
    dormitorios?: number;
    banos?: number;
    estadoComercial?: string;
    estadoPublicacion?: string;
    descripcion?: string;
};

@Injectable()
export class PropertyWriteTools {
    constructor(
        private readonly propertiesService: PropertiesService,
        private readonly ownersService: OwnersService,
        private readonly draftService: AssistantDraftService,
    ) {}

    canHandle(name: AssistantToolName): boolean {
        return (
            name === 'buscar_propietario' ||
            name === 'crear_propietario' ||
            name === 'preparar_propiedad' ||
            name === 'confirmar_crear_propiedad'
        );
    }

    async execute(name: AssistantToolName, args: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
        this.assertCanCreate(ctx.role);

        switch (name) {
            case 'buscar_propietario':
                return this.buscarPropietario(args as { busqueda?: string }, ctx);
            case 'crear_propietario':
                return this.crearPropietario(
                    args as { nombre?: string; apellido?: string; nombreCompleto?: string; email?: string; telefono?: string },
                    ctx,
                );
            case 'preparar_propiedad':
                return this.prepararPropiedad(args as PrepararPropiedadArgs, ctx);
            case 'confirmar_crear_propiedad':
                return this.confirmarCrearPropiedad(args as { confirmacion?: boolean }, ctx);
            default:
                throw new Error(`Herramienta de escritura desconocida: ${name}`);
        }
    }

    private assertCanCreate(role: string) {
        if (!CREATE_PROPERTY_ROLES.has(role)) {
            throw new ForbiddenException('Tu rol no tiene permiso para crear propiedades desde el asistente.');
        }
    }

    private async buscarPropietario(args: { busqueda?: string }, ctx: ToolContext) {
        if (!args.busqueda?.trim()) {
            return { error: 'Indica un nombre o correo para buscar propietario.' };
        }

        const results = await this.ownersService.search(ctx.organizationId, args.busqueda);
        return {
            total: results.length,
            propietarios: results.map((o) => ({
                id: o.id,
                nombre: o.label,
                email: o.email,
                telefono: o.phone,
            })),
        };
    }

    private async crearPropietario(
        args: { nombre?: string; apellido?: string; nombreCompleto?: string; email?: string; telefono?: string },
        ctx: ToolContext,
    ) {
        let firstName = args.nombre?.trim() ?? '';
        let lastName = args.apellido?.trim() ?? '';

        if (!firstName && args.nombreCompleto?.trim()) {
            const parts = args.nombreCompleto.trim().split(/\s+/);
            firstName = parts[0] ?? '';
            lastName = parts.slice(1).join(' ') || '—';
        }

        if (!firstName) {
            return { error: 'Se requiere nombre del propietario (nombre + apellido o nombreCompleto).' };
        }

        if (!lastName) lastName = '—';

        const created = await this.ownersService.create(ctx.organizationId, {
            firstName,
            lastName,
            email: args.email?.trim() || undefined,
            phone: args.telefono?.trim() || undefined,
        });

        return {
            exito: true,
            propietario: {
                id: created.id,
                nombre: created.label,
                email: created.email,
                telefono: created.phone,
            },
        };
    }

    private async resolveOwnerId(
        args: PrepararPropiedadArgs,
        ctx: ToolContext,
    ): Promise<{ ownerId: string; ownerLabel: string } | { error: string; propietarios?: unknown[] }> {
        if (args.propietarioId) {
            try {
                const owner = await this.ownersService.findOne(ctx.organizationId, args.propietarioId);
                return { ownerId: owner.id, ownerLabel: owner.label };
            } catch {
                return { error: 'El propietarioId indicado no existe en tu organización.' };
            }
        }

        if (!args.propietarioNombre?.trim()) {
            return { error: 'Falta propietario: indica propietarioId o propietarioNombre, o usa buscar_propietario / crear_propietario.' };
        }

        const matches = await this.ownersService.search(ctx.organizationId, args.propietarioNombre);
        if (matches.length === 1) {
            return { ownerId: matches[0].id, ownerLabel: matches[0].label };
        }
        if (matches.length > 1) {
            return {
                error: 'Hay varios propietarios con ese nombre. Pide al usuario que aclare o usa propietarioId.',
                propietarios: matches.map((o) => ({ id: o.id, nombre: o.label })),
            };
        }

        return {
            error: `No encontré propietario "${args.propietarioNombre}". Usa crear_propietario o pide el nombre completo.`,
        };
    }

    private async prepararPropiedad(args: PrepararPropiedadArgs, ctx: ToolContext) {
        const camposFaltantes: string[] = [];
        if (!args.titulo?.trim()) camposFaltantes.push('titulo');
        if (!args.tipo?.trim()) camposFaltantes.push('tipo');
        if (!args.ciudad?.trim()) camposFaltantes.push('ciudad');
        if (args.arriendoMensual === undefined || args.arriendoMensual <= 0) camposFaltantes.push('arriendoMensual');

        if (camposFaltantes.length > 0) {
            return {
                listo: false,
                camposFaltantes,
                mensaje: 'Faltan datos obligatorios. Pregunta al usuario antes de preparar.',
            };
        }

        const ownerResult = await this.resolveOwnerId(args, ctx);
        if ('error' in ownerResult) {
            return ownerResult;
        }

        const propertyType = parsePropertyType(args.tipo!) ?? PropertyType.APARTMENT;
        const commercialStatus = parseCommercialStatus(args.estadoComercial ?? 'disponible') ?? PropertyCommercialStatus.AVAILABLE;
        const publicationStatus =
            parsePublicationStatus(args.estadoPublicacion ?? 'borrador') ?? PropertyPublicationStatus.DRAFT;

        const code = generatePropertyCode(args.titulo!);
        const currency = (args.moneda?.trim() || 'CLP').toUpperCase();
        const country = args.pais?.trim() || 'Chile';

        const dto: CreatePropertyDto = {
            ownerId: ownerResult.ownerId,
            code,
            title: args.titulo!.trim(),
            description: args.descripcion?.trim(),
            propertyType,
            monthlyRent: args.arriendoMensual!,
            currency,
            city: args.ciudad!.trim(),
            country,
            address: args.direccion?.trim(),
            commercialStatus,
            publicationStatus,
            isVisible: publicationStatus === PropertyPublicationStatus.PUBLISHED,
            bedrooms: args.dormitorios ?? 0,
            bathrooms: args.banos ?? 0,
        };

        const preview: PropertyDraftPreview = {
            titulo: dto.title,
            tipo: propertyTypeToEs(propertyType),
            propietario: ownerResult.ownerLabel,
            propietarioId: ownerResult.ownerId,
            arriendoMensual: dto.monthlyRent,
            moneda: currency,
            ciudad: dto.city,
            pais: country,
            direccion: dto.address ?? null,
            dormitorios: dto.bedrooms ?? 0,
            banos: dto.bathrooms ?? 0,
            estadoComercial: commercialStatusToEs(commercialStatus),
            estadoPublicacion: publicationStatusToEs(publicationStatus),
            codigoPropuesto: code,
            descripcion: dto.description ?? null,
        };

        this.draftService.save(ctx.organizationId, ctx.userId, ctx.sessionId, dto, preview);

        return {
            listo: true,
            requiereConfirmacion: true,
            vistaPrevia: preview,
            mensaje: 'Muestra el resumen al usuario y pide confirmación explícita antes de llamar confirmar_crear_propiedad.',
        };
    }

    private async confirmarCrearPropiedad(args: { confirmacion?: boolean }, ctx: ToolContext) {
        if (args.confirmacion !== true) {
            return {
                error: 'No se creó la propiedad. El usuario debe confirmar explícitamente (confirmacion: true).',
            };
        }

        const draft = this.draftService.get(ctx.organizationId, ctx.userId, ctx.sessionId);
        if (!draft) {
            return {
                error: 'No hay propiedad pendiente en esta conversación. Usa preparar_propiedad primero.',
            };
        }

        const created = await this.propertiesService.create(draft.dto, ctx.organizationId, ctx.userId);
        this.draftService.clear(ctx.organizationId, ctx.userId, ctx.sessionId);

        return {
            exito: true,
            propiedad: toPropertySummaryEs({
                id: created.id,
                code: created.code,
                title: created.title,
                propertyType: created.propertyType,
                commercialStatus: created.commercialStatus,
                publicationStatus: created.publicationStatus,
                location: created.location,
                rentalDetail: created.rentalDetail,
                feature: created.feature,
            }),
        };
    }
}

function generatePropertyCode(title: string): string {
    const slug = title
        .trim()
        .slice(0, 12)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 6);
    return `HOM-${slug || 'NEW'}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}
