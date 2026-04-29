import { buildPublicApiUrl } from './api-base';
import { getAccessToken } from './auth';

type ApiError = {
    error: string;
    status?: number;
};

export type PropertyOption = {
    id: string;
    title: string;
    code: string;
};

export type PropertyType = 'apartment' | 'house' | 'studio' | 'office' | 'warehouse' | 'land';
export type PropertyCommercialStatus = 'available' | 'reserved' | 'rented' | 'inactive';
export type PropertyPublicationStatus = 'draft' | 'published' | 'hidden';

export type Property = {
    id: string;
    organizationId: string;
    ownerId: string;
    code: string;
    title: string;
    description?: string | null;
    propertyType: PropertyType;
    commercialStatus: PropertyCommercialStatus;
    publicationStatus: PropertyPublicationStatus;
    isVisible: boolean;
    createdAt: string;
    updatedAt: string;
};

export type CreatePropertyPayload = {
    ownerId: string;
    code: string;
    title: string;
    description?: string;
    propertyType: PropertyType;
    commercialStatus?: PropertyCommercialStatus;
    publicationStatus?: PropertyPublicationStatus;
    isVisible?: boolean;
};

function buildApiUrl(path: string): string {
    return buildPublicApiUrl(path);
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isApiError(value: unknown): value is ApiError {
    return isObject(value) && typeof value.error === 'string';
}

async function parseErrorResponse(res: Response): Promise<string> {
    const text = await res.text();
    if (!text) {
        return res.statusText || 'Request failed';
    }

    try {
        const parsed = JSON.parse(text) as unknown;
        if (isObject(parsed) && typeof parsed.message === 'string') {
            return parsed.message;
        }

        if (isObject(parsed) && Array.isArray(parsed.message) && parsed.message.every((item) => typeof item === 'string')) {
            return parsed.message.join(', ');
        }

        return text;
    } catch {
        return text;
    }
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T | ApiError> {
    const token = getAccessToken();
    if (!token) {
        return { error: 'Missing access token', status: 401 };
    }

    const response = await fetch(buildApiUrl(path), {
        ...init,
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            ...(init.headers ?? {}),
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        return { error: await parseErrorResponse(response), status: response.status };
    }

    if (response.status === 204) {
        return {} as T;
    }

    return (await response.json()) as T;
}

function isPropertyListItem(value: unknown): value is { id: string; code: string; title?: string } {
    return isObject(value) && typeof value.id === 'string' && typeof value.code === 'string';
}

function isProperty(value: unknown): value is Property {
    if (!isObject(value)) return false;
    return (
        typeof value.id === 'string' &&
        typeof value.organizationId === 'string' &&
        typeof value.ownerId === 'string' &&
        typeof value.code === 'string' &&
        typeof value.title === 'string' &&
        typeof value.propertyType === 'string' &&
        typeof value.commercialStatus === 'string' &&
        typeof value.publicationStatus === 'string' &&
        typeof value.isVisible === 'boolean' &&
        typeof value.createdAt === 'string' &&
        typeof value.updatedAt === 'string'
    );
}

export async function getProperties(): Promise<PropertyOption[] | ApiError> {
    const response = await requestJson<unknown[]>('/api/properties');
    if (isApiError(response)) {
        return response;
    }

    if (!Array.isArray(response)) {
        return { error: 'Invalid properties response', status: 500 };
    }

    return response
        .filter((item) => isProperty(item) || isPropertyListItem(item))
        .map((item) => ({
            id: item.id,
            code: item.code,
            title: isProperty(item) ? item.title : item.title ?? item.code,
        }));
}

export async function listPropertiesFull(): Promise<Property[] | ApiError> {
    const response = await requestJson<unknown[]>('/api/properties');
    if (isApiError(response)) {
        return response;
    }

    if (!Array.isArray(response) || !response.every((item) => isProperty(item))) {
        return { error: 'Invalid properties response', status: 500 };
    }

    return response;
}

export async function createProperty(payload: CreatePropertyPayload): Promise<Property | ApiError> {
    const response = await requestJson<unknown>('/api/properties', {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    if (isApiError(response)) {
        return response;
    }

    if (!isProperty(response)) {
        return { error: 'Invalid create property response', status: 500 };
    }

    return response;
}

export async function downloadPropertyRecordsPdf(
    propertyId: string,
    startDate?: string,
    endDate?: string,
): Promise<true | ApiError> {
    const token = getAccessToken();
    if (!token) {
        return { error: 'Missing access token', status: 401 };
    }

    const qs = new URLSearchParams();
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    const suffix = qs.toString();

    const response = await fetch(buildApiUrl(`/api/properties/${propertyId}/report/pdf${suffix ? `?${suffix}` : ''}`), {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
    });

    if (!response.ok) {
        return { error: await parseErrorResponse(response), status: response.status };
    }

    const blob = await response.blob();
    const cd = response.headers.get('Content-Disposition');
    let filename = 'registros-propiedad.pdf';
    const star = cd?.match(/filename\*=UTF-8''([^;]+)/i);
    if (star) {
        filename = decodeURIComponent(star[1].trim());
    } else {
        const basic = cd?.match(/filename="([^"]+)"/);
        if (basic) filename = basic[1];
    }

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return true;
}
