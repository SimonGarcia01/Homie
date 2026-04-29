import { getAuthHeader } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ?? '';

export type PropertySummary = {
    id: string;
    code: string;
    title: string;
    propertyType: string;
    commercialStatus: string;
    publicationStatus: string;
    coverImageUrl: string | null;
};

type ApiError = {
    error: string;
    status?: number;
};

export type PropertiesListResponse = PropertySummary[] | ApiError;

function buildApiUrl(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return API_BASE_URL ? `${API_BASE_URL}${normalized}` : normalized;
}

export async function listProperties(): Promise<PropertiesListResponse> {
    const res = await fetch(buildApiUrl('/api/properties'), {
        headers: { ...getAuthHeader() },
        cache: 'no-store',
    });
    if (!res.ok) {
        const text = await res.text();
        return { error: text || res.statusText, status: res.status };
    }
    return (await res.json()) as PropertySummary[];
}
