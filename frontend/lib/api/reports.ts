import { buildPublicApiUrl } from './api-base';
import { getAccessToken } from './auth';

type ApiError = {
    error: string;
    status?: number;
};

export type MonthlyIncomesSummary = {
    currentMonth: number;
    previousMonth: number;
    diff: number;
};

export type AvailableProperty = {
    id: string;
    code: string;
    title: string;
    propertyType: string;
    availableDate?: string;
    rentalDetail?: {
        monthlyRent: string;
        currency: string;
    };
};

export type GlobalExpense = {
    property: string;
    category: string;
    total: number;
};

async function parseErrorResponse(res: Response): Promise<string> {
    const text = await res.text();
    try {
        const parsed = JSON.parse(text);
        return parsed.message || text;
    } catch {
        return text || res.statusText;
    }
}

async function requestJson<T>(path: string): Promise<T | ApiError> {
    const token = getAccessToken();
    if (!token) return { error: 'No token', status: 401 };

    const response = await fetch(buildPublicApiUrl(path), {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        cache: 'no-store',
    });

    if (!response.ok) {
        return { error: await parseErrorResponse(response), status: response.status };
    }
    return response.json();
}

export async function getIncomesSummary(): Promise<MonthlyIncomesSummary | ApiError> {
    return requestJson<MonthlyIncomesSummary>('/api/reports/incomes/monthly');
}

export async function getAvailableProperties(): Promise<AvailableProperty[] | ApiError> {
    return requestJson<AvailableProperty[]>('/api/reports/properties/available');
}

export async function getGlobalExpenses(startDate?: string, endDate?: string): Promise<GlobalExpense[] | ApiError> {
    let url = '/api/reports/expenses';
    const params = new URLSearchParams();
    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (params.toString()) url += `?${params.toString()}`;
    
    return requestJson<GlobalExpense[]>(url);
}
