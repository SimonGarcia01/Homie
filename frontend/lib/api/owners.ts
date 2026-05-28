import { buildPublicApiUrl } from './api-base';
import { getAccessToken } from './auth';

type ApiError = {
    error: string;
    status?: number;
};

export type OwnerOption = {
    id: string;
    contactId: string;
    label: string;
    email: string | null;
    phone?: string | null;
};

export type CreateOwnerPayload = {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    ownerType?: 'person' | 'company';
};

export type UpdateOwnerPayload = Partial<CreateOwnerPayload>;

export type OwnerDetail = OwnerOption & {
    ownerType: string;
    firstName: string;
    lastName: string;
};

function buildApiUrl(path: string): string {
    return buildPublicApiUrl(path);
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
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

function isOwnerOption(value: unknown): value is OwnerOption {
    return (
        isObject(value) &&
        typeof value.id === 'string' &&
        typeof value.contactId === 'string' &&
        typeof value.label === 'string' &&
        (value.email === null || typeof value.email === 'string')
    );
}

export async function getOwnerOptions(): Promise<OwnerOption[] | ApiError> {
    const token = getAccessToken();
    if (!token) {
        return { error: 'Missing access token', status: 401 };
    }

    const response = await fetch(buildApiUrl('/api/owners'), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        cache: 'no-store',
    });

    if (!response.ok) {
        return { error: await parseErrorResponse(response), status: response.status };
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload) || !payload.every((item) => isOwnerOption(item))) {
        return { error: 'Invalid owners response', status: 500 };
    }

    return payload;
}

function isOwnerDetail(value: unknown): value is OwnerDetail {
    return (
        isOwnerOption(value) &&
        typeof (value as OwnerDetail).firstName === 'string' &&
        typeof (value as OwnerDetail).lastName === 'string'
    );
}

export async function createOwner(payload: CreateOwnerPayload): Promise<OwnerDetail | ApiError> {
    const token = getAccessToken();
    if (!token) {
        return { error: 'Missing access token', status: 401 };
    }

    const response = await fetch(buildApiUrl('/api/owners'), {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        return { error: await parseErrorResponse(response), status: response.status };
    }

    const data = (await response.json()) as unknown;
    if (!isOwnerDetail(data)) {
        return { error: 'Invalid owner response', status: 500 };
    }

    return data;
}

export async function listOwners(): Promise<OwnerDetail[] | ApiError> {
    const token = getAccessToken();
    if (!token) {
        return { error: 'Missing access token', status: 401 };
    }

    const response = await fetch(buildApiUrl('/api/owners/list'), {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        cache: 'no-store',
    });

    if (!response.ok) {
        return { error: await parseErrorResponse(response), status: response.status };
    }

    const payload = (await response.json()) as unknown;
    if (!Array.isArray(payload) || !payload.every((item) => isOwnerDetail(item))) {
        return { error: 'Invalid owners response', status: 500 };
    }

    return payload;
}

export async function updateOwner(id: string, payload: UpdateOwnerPayload): Promise<OwnerDetail | ApiError> {
    const token = getAccessToken();
    if (!token) {
        return { error: 'Missing access token', status: 401 };
    }

    const response = await fetch(buildApiUrl(`/api/owners/${id}`), {
        method: 'PATCH',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        return { error: await parseErrorResponse(response), status: response.status };
    }

    const data = (await response.json()) as unknown;
    if (!isOwnerDetail(data)) {
        return { error: 'Invalid owner response', status: 500 };
    }

    return data;
}

export async function deleteOwner(id: string): Promise<{ id: string } | ApiError> {
    const token = getAccessToken();
    if (!token) {
        return { error: 'Missing access token', status: 401 };
    }

    const response = await fetch(buildApiUrl(`/api/owners/${id}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
        return { error: await parseErrorResponse(response), status: response.status };
    }

    const data = (await response.json()) as unknown;
    if (!isObject(data) || typeof data.id !== 'string') {
        return { error: 'Invalid delete owner response', status: 500 };
    }

    return { id: data.id };
}
