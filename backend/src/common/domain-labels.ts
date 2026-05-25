import {
    PropertyCommercialStatus,
    PropertyPublicationStatus,
    PropertyType,
    UserRoleName,
} from './enums';

const TYPE_TO_ES: Record<PropertyType, string> = {
    [PropertyType.APARTMENT]: 'departamento',
    [PropertyType.HOUSE]: 'casa',
    [PropertyType.STUDIO]: 'departamento',
    [PropertyType.OFFICE]: 'oficina',
    [PropertyType.WAREHOUSE]: 'bodega',
    [PropertyType.LAND]: 'terreno',
    [PropertyType.OTHER]: 'otro',
};

const COMMERCIAL_TO_ES: Record<PropertyCommercialStatus, string> = {
    [PropertyCommercialStatus.AVAILABLE]: 'disponible',
    [PropertyCommercialStatus.RESERVED]: 'reservada',
    [PropertyCommercialStatus.RENTED]: 'arrendada',
    [PropertyCommercialStatus.INACTIVE]: 'inactiva',
};

const PUBLICATION_TO_ES: Record<PropertyPublicationStatus, string> = {
    [PropertyPublicationStatus.DRAFT]: 'borrador',
    [PropertyPublicationStatus.PUBLISHED]: 'publicada',
    [PropertyPublicationStatus.HIDDEN]: 'pausada',
};

const ROLE_TO_ES: Record<string, string> = {
    [UserRoleName.ADMIN]: 'administrador',
    [UserRoleName.AGENT]: 'agente',
    [UserRoleName.COORDINATOR]: 'coordinador',
};

const ES_TO_TYPE: Record<string, PropertyType> = {
    departamento: PropertyType.APARTMENT,
    apartment: PropertyType.APARTMENT,
    casa: PropertyType.HOUSE,
    house: PropertyType.HOUSE,
    oficina: PropertyType.OFFICE,
    office: PropertyType.OFFICE,
    bodega: PropertyType.WAREHOUSE,
    warehouse: PropertyType.WAREHOUSE,
    terreno: PropertyType.LAND,
    land: PropertyType.LAND,
    local: PropertyType.OTHER,
    otro: PropertyType.OTHER,
    other: PropertyType.OTHER,
    studio: PropertyType.STUDIO,
};

const ES_TO_COMMERCIAL: Record<string, PropertyCommercialStatus> = {
    disponible: PropertyCommercialStatus.AVAILABLE,
    available: PropertyCommercialStatus.AVAILABLE,
    reservada: PropertyCommercialStatus.RESERVED,
    reserved: PropertyCommercialStatus.RESERVED,
    arrendada: PropertyCommercialStatus.RENTED,
    rented: PropertyCommercialStatus.RENTED,
    inactiva: PropertyCommercialStatus.INACTIVE,
    inactive: PropertyCommercialStatus.INACTIVE,
};

const ES_TO_PUBLICATION: Record<string, PropertyPublicationStatus> = {
    borrador: PropertyPublicationStatus.DRAFT,
    draft: PropertyPublicationStatus.DRAFT,
    publicada: PropertyPublicationStatus.PUBLISHED,
    published: PropertyPublicationStatus.PUBLISHED,
    pausada: PropertyPublicationStatus.HIDDEN,
    hidden: PropertyPublicationStatus.HIDDEN,
};

export function propertyTypeToEs(type: PropertyType): string {
    return TYPE_TO_ES[type] ?? type;
}

export function commercialStatusToEs(status: PropertyCommercialStatus): string {
    return COMMERCIAL_TO_ES[status] ?? status;
}

export function publicationStatusToEs(status: PropertyPublicationStatus): string {
    return PUBLICATION_TO_ES[status] ?? status;
}

export function roleToEs(role: string): string {
    return ROLE_TO_ES[role] ?? role;
}

export function parsePropertyType(value?: string): PropertyType | undefined {
    if (!value) return undefined;
    return ES_TO_TYPE[value.toLowerCase().trim()];
}

export function parseCommercialStatus(value?: string): PropertyCommercialStatus | undefined {
    if (!value) return undefined;
    return ES_TO_COMMERCIAL[value.toLowerCase().trim()];
}

export function parsePublicationStatus(value?: string): PropertyPublicationStatus | undefined {
    if (!value) return undefined;
    return ES_TO_PUBLICATION[value.toLowerCase().trim()];
}

export type PropertySummaryEs = {
    id: string;
    code: string;
    title: string;
    tipo: string;
    estadoComercial: string;
    estadoPublicacion: string;
    ciudad: string;
    pais: string;
    direccion: string | null;
    arriendoMensual: number;
    moneda: string;
    dormitorios: number;
    banos: number;
};

export function toPropertySummaryEs(property: {
    id: string;
    code: string;
    title: string;
    propertyType: PropertyType;
    commercialStatus: PropertyCommercialStatus;
    publicationStatus: PropertyPublicationStatus;
    location?: { city?: string; country?: string; address?: string | null } | null;
    rentalDetail?: { monthlyRent?: string; currency?: string } | null;
    feature?: { bedrooms?: number; bathrooms?: number } | null;
}): PropertySummaryEs {
    return {
        id: property.id,
        code: property.code,
        title: property.title,
        tipo: propertyTypeToEs(property.propertyType),
        estadoComercial: commercialStatusToEs(property.commercialStatus),
        estadoPublicacion: publicationStatusToEs(property.publicationStatus),
        ciudad: property.location?.city ?? '',
        pais: property.location?.country ?? '',
        direccion: property.location?.address ?? null,
        arriendoMensual: Number.parseFloat(property.rentalDetail?.monthlyRent ?? '0') || 0,
        moneda: property.rentalDetail?.currency ?? 'CLP',
        dormitorios: property.feature?.bedrooms ?? 0,
        banos: property.feature?.bathrooms ?? 0,
    };
}
