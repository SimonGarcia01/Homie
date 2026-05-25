/**
 * Resuelve URLs de archivos estáticos (/uploads/...) para el navegador.
 * En dev usa el rewrite de Next; con NEXT_PUBLIC_API_BASE_URL apunta al backend.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;

    const normalized = url.startsWith('/') ? url : `/${url}`;
    const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
    if (fromEnv && normalized.startsWith('/uploads')) {
        return `${fromEnv.replace(/\/+$/, '')}${normalized}`;
    }
    return normalized;
}
