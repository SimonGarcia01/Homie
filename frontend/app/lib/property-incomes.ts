import { buildPublicApiUrl } from './api-base';
import { getAccessToken } from './auth';

export { getProperties, type PropertyOption } from './properties';

type ApiError = {
    error: string;
    status?: number;
};

export type PropertyIncomeType = 'arriendo' | 'venta';

export type PropertyIncome = {
    id: string;
    propertyId: string;
    amount: number;
    incomeDate: string;
    incomeType: PropertyIncomeType;
    description: string;
    createdAt: string;
    updatedAt: string;
};

export type IncomeSummary = {
    propertyId: string;
    startDate: string | null;
    endDate: string | null;
    total: number;
    entries: number;
};

export type IncomePayload = {
    amount: number;
    incomeDate: string;
    incomeType: PropertyIncomeType;
    description: string;
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

async function request<T>(path: string, init: RequestInit = {}): Promise<T | ApiError> {
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

function isIncome(value: unknown): value is PropertyIncome {
    return (
        isObject(value) &&
        typeof value.id === 'string' &&
        typeof value.propertyId === 'string' &&
        typeof value.amount === 'number' &&
        typeof value.incomeDate === 'string' &&
        (value.incomeType === 'arriendo' || value.incomeType === 'venta') &&
        typeof value.description === 'string' &&
        typeof value.createdAt === 'string' &&
        typeof value.updatedAt === 'string'
    );
}

function isIncomeSummary(value: unknown): value is IncomeSummary {
    return (
        isObject(value) &&
        typeof value.propertyId === 'string' &&
        (typeof value.startDate === 'string' || value.startDate === null) &&
        (typeof value.endDate === 'string' || value.endDate === null) &&
        typeof value.total === 'number' &&
        typeof value.entries === 'number'
    );
}

export async function getIncomes(propertyId: string): Promise<PropertyIncome[] | ApiError> {
    const response = await request<unknown[]>(`/api/properties/${propertyId}/incomes`);
    if (isApiError(response)) {
        return response;
    }

    if (!Array.isArray(response) || !response.every((item) => isIncome(item))) {
        return { error: 'Invalid income history response', status: 500 };
    }

    return response;
}

export async function getIncomeSummary(
    propertyId: string,
    startDate?: string,
    endDate?: string,
): Promise<IncomeSummary | ApiError> {
    const query = new URLSearchParams();
    if (startDate) query.set('startDate', startDate);
    if (endDate) query.set('endDate', endDate);

    const suffix = query.toString();
    const response = await request<unknown>(`/api/properties/${propertyId}/incomes/summary${suffix ? `?${suffix}` : ''}`);
    if (isApiError(response)) {
        return response;
    }

    if (!isIncomeSummary(response)) {
        return { error: 'Invalid income summary response', status: 500 };
    }

    return response;
}

export async function createIncome(propertyId: string, payload: IncomePayload): Promise<PropertyIncome | ApiError> {
    const response = await request<unknown>(`/api/properties/${propertyId}/incomes`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    if (isApiError(response)) {
        return response;
    }

    if (!isIncome(response)) {
        return { error: 'Invalid create income response', status: 500 };
    }

    return response;
}

export async function updateIncome(
    propertyId: string,
    incomeId: string,
    payload: IncomePayload,
): Promise<PropertyIncome | ApiError> {
    const response = await request<unknown>(`/api/properties/${propertyId}/incomes/${incomeId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });

    if (isApiError(response)) {
        return response;
    }

    if (!isIncome(response)) {
        return { error: 'Invalid update income response', status: 500 };
    }

    return response;
}

export async function deleteIncome(propertyId: string, incomeId: string): Promise<{ id: string } | ApiError> {
    const response = await request<unknown>(`/api/properties/${propertyId}/incomes/${incomeId}`, {
        method: 'DELETE',
    });

    if (isApiError(response)) {
        return response;
    }

    if (!isObject(response) || typeof response.id !== 'string') {
        return { error: 'Invalid delete income response', status: 500 };
    }

    return response as { id: string };
}
