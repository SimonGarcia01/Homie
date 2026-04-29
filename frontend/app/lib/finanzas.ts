import { buildPublicApiUrl } from './api-base';
import { getAccessToken } from './auth';

type ApiError = {
    error: string;
    status?: number;
};

export type PropertyExpenseCategory = 'mantenimiento' | 'impuesto' | 'servicio';

export type PropertyExpenseRow = {
    id: string;
    propertyId: string;
    amount: number;
    expenseDate: string;
    expenseCategory: PropertyExpenseCategory;
    description: string;
    createdAt: string;
    updatedAt: string;
};

export type PropertyBalance = {
    propertyId: string;
    startDate: string | null;
    endDate: string | null;
    totalIncomes: number;
    totalExpenses: number;
    balance: number;
    incomeCount: number;
    expenseCount: number;
};

export type ExpenseReportCategory = {
    category: PropertyExpenseCategory;
    subtotal: number;
    count: number;
    items: PropertyExpenseRow[];
};

export type ExpenseReport = {
    propertyId: string;
    startDate: string | null;
    endDate: string | null;
    categories: ExpenseReportCategory[];
};

export type CreateExpensePayload = {
    amount: number;
    expenseDate: string;
    expenseCategory: PropertyExpenseCategory;
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

function isExpenseCategory(v: unknown): v is PropertyExpenseCategory {
    return v === 'mantenimiento' || v === 'impuesto' || v === 'servicio';
}

function isExpenseRow(value: unknown): value is PropertyExpenseRow {
    return (
        isObject(value) &&
        typeof value.id === 'string' &&
        typeof value.propertyId === 'string' &&
        typeof value.amount === 'number' &&
        typeof value.expenseDate === 'string' &&
        isExpenseCategory(value.expenseCategory) &&
        typeof value.description === 'string' &&
        typeof value.createdAt === 'string' &&
        typeof value.updatedAt === 'string'
    );
}

function isBalance(value: unknown): value is PropertyBalance {
    return (
        isObject(value) &&
        typeof value.propertyId === 'string' &&
        (typeof value.startDate === 'string' || value.startDate === null) &&
        (typeof value.endDate === 'string' || value.endDate === null) &&
        typeof value.totalIncomes === 'number' &&
        typeof value.totalExpenses === 'number' &&
        typeof value.balance === 'number' &&
        typeof value.incomeCount === 'number' &&
        typeof value.expenseCount === 'number'
    );
}

function isExpenseReport(value: unknown): value is ExpenseReport {
    if (!isObject(value) || typeof value.propertyId !== 'string') return false;
    if ((value.startDate !== null && typeof value.startDate !== 'string') || (value.endDate !== null && typeof value.endDate !== 'string'))
        return false;
    if (!Array.isArray(value.categories)) return false;
    for (const cat of value.categories) {
        if (!isObject(cat) || !isExpenseCategory(cat.category)) return false;
        if (typeof cat.subtotal !== 'number' || typeof cat.count !== 'number' || !Array.isArray(cat.items)) return false;
        if (!cat.items.every((item: unknown) => isExpenseRow(item))) return false;
    }
    return true;
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

export async function getExpenses(propertyId: string): Promise<PropertyExpenseRow[] | ApiError> {
    const response = await requestJson<unknown[]>(`/api/properties/${propertyId}/expenses`);
    if (isApiError(response)) return response;
    if (!Array.isArray(response) || !response.every((item) => isExpenseRow(item))) {
        return { error: 'Invalid expenses response', status: 500 };
    }
    return response;
}

export async function createExpense(propertyId: string, payload: CreateExpensePayload): Promise<PropertyExpenseRow | ApiError> {
    const response = await requestJson<unknown>(`/api/properties/${propertyId}/expenses`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
    if (isApiError(response)) return response;
    if (!isExpenseRow(response)) {
        return { error: 'Invalid expense response', status: 500 };
    }
    return response;
}

export async function deleteExpense(propertyId: string, expenseId: string): Promise<{ id: string } | ApiError> {
    const response = await requestJson<unknown>(`/api/properties/${propertyId}/expenses/${expenseId}`, {
        method: 'DELETE',
    });
    if (isApiError(response)) return response;
    if (!isObject(response) || typeof response.id !== 'string') {
        return { error: 'Invalid delete response', status: 500 };
    }
    return response as { id: string };
}

export async function getBalance(
    propertyId: string,
    startDate?: string,
    endDate?: string,
): Promise<PropertyBalance | ApiError> {
    const qs = new URLSearchParams();
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    const suffix = qs.toString();
    const response = await requestJson<unknown>(`/api/properties/${propertyId}/balance${suffix ? `?${suffix}` : ''}`);
    if (isApiError(response)) return response;
    if (!isBalance(response)) {
        return { error: 'Invalid balance response', status: 500 };
    }
    return response;
}

export async function getExpenseReport(
    propertyId: string,
    startDate?: string,
    endDate?: string,
): Promise<ExpenseReport | ApiError> {
    const qs = new URLSearchParams();
    if (startDate) qs.set('startDate', startDate);
    if (endDate) qs.set('endDate', endDate);
    const suffix = qs.toString();
    const response = await requestJson<unknown>(`/api/properties/${propertyId}/expenses/report${suffix ? `?${suffix}` : ''}`);
    if (isApiError(response)) return response;
    if (!isExpenseReport(response)) {
        return { error: 'Invalid expense report response', status: 500 };
    }
    return response;
}
