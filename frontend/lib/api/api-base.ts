/**
 * Construye la URL del API.
 *
 * - Si existe `NEXT_PUBLIC_API_BASE_URL`, se llama al backend en ese origen (p. ej. producción).
 * - Si no, se usa ruta relativa `/api/...`, que Next reescribe al Nest local (`next.config.ts` → BACKEND_ORIGIN o PORT en `backend/.env`).
 */
function normalizeOrigin(url: string): string {
    return url.replace(/\/+$/, '');
}

export function buildPublicApiUrl(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (fromEnv) {
        return `${normalizeOrigin(fromEnv)}${normalizedPath}`;
    }
    return normalizedPath;
}
