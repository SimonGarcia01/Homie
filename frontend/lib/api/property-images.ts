import { buildPublicApiUrl } from './api-base';
import { getAuthHeader } from './auth';

export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export const ALLOWED_IMAGE_EXTENSIONS_LABEL = 'JPG, PNG, WEBP';
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGE_MB = 5;

export type PropertyImage = {
    id: string;
    propertyId: string;
    url: string;
    storageKey: string;
    mimeType: string;
    sizeBytes: number;
    originalFilename: string;
    isCover: boolean;
    sortOrder: number;
    createdAt: string;
};

export type RejectedImage = {
    filename: string;
    reason: string;
};

export type UploadResult = {
    uploaded: PropertyImage[];
    rejected: RejectedImage[];
};

type ApiError = {
    error: string;
    status?: number;
};

export type ListImagesResponse = PropertyImage[] | ApiError;
export type UploadImagesResponse = UploadResult | ApiError;
export type SetCoverResponse = PropertyImage | ApiError;
export type DeleteImageResponse = { id: string; newCoverId: string | null } | ApiError;

function buildApiUrl(path: string): string {
    return buildPublicApiUrl(path);
}

function isObject(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

async function readError(res: Response): Promise<string> {
    const text = await res.text();
    if (!text) return res.statusText || 'Request failed';
    try {
        const parsed = JSON.parse(text) as unknown;
        if (isObject(parsed) && typeof parsed.message === 'string') return parsed.message;
        if (isObject(parsed) && Array.isArray(parsed.message)) {
            return parsed.message.filter((item): item is string => typeof item === 'string').join(', ');
        }
        return text;
    } catch {
        return text;
    }
}

export function validateImageClientSide(file: File): string | null {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
        return `Formato no permitido. Acepta ${ALLOWED_IMAGE_EXTENSIONS_LABEL}.`;
    }
    if (file.size > MAX_IMAGE_BYTES) {
        return `Tamaño excedido. Máximo ${MAX_IMAGE_MB} MB.`;
    }
    return null;
}

export async function listPropertyImages(propertyId: string): Promise<ListImagesResponse> {
    const res = await fetch(buildApiUrl(`/api/properties/${propertyId}/images`), {
        headers: { ...getAuthHeader() },
        cache: 'no-store',
    });
    if (!res.ok) return { error: await readError(res), status: res.status };
    return (await res.json()) as PropertyImage[];
}

export async function uploadPropertyImages(propertyId: string, files: File[]): Promise<UploadImagesResponse> {
    const formData = new FormData();
    for (const file of files) {
        formData.append('files', file, file.name);
    }
    const res = await fetch(buildApiUrl(`/api/properties/${propertyId}/images`), {
        method: 'POST',
        headers: { ...getAuthHeader() },
        body: formData,
    });
    if (!res.ok) return { error: await readError(res), status: res.status };
    return (await res.json()) as UploadResult;
}

export async function deletePropertyImage(propertyId: string, imageId: string): Promise<DeleteImageResponse> {
    const res = await fetch(buildApiUrl(`/api/properties/${propertyId}/images/${imageId}`), {
        method: 'DELETE',
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) return { error: await readError(res), status: res.status };
    return (await res.json()) as { id: string; newCoverId: string | null };
}

export async function setPropertyImageCover(propertyId: string, imageId: string): Promise<SetCoverResponse> {
    const res = await fetch(buildApiUrl(`/api/properties/${propertyId}/images/${imageId}/cover`), {
        method: 'PATCH',
        headers: { ...getAuthHeader() },
    });
    if (!res.ok) return { error: await readError(res), status: res.status };
    return (await res.json()) as PropertyImage;
}

export function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
