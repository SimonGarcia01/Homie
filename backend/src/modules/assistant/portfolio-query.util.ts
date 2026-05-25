const DIACRITICS = /[\u0300-\u036f]/g;

function normalize(text: string) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(DIACRITICS, '');
}

export function isPortfolioCountQuery(message: string): boolean {
    const m = normalize(message);
    const asksAboutProperties = /\bpropiedades?\b/.test(m) || /\bportafolio\b/.test(m);
    const asksQuantity =
        /\b(cuantas|cuantos|cuanto|total|numero|tengo|hay|registrad|existen|llevo|tenemos)\b/.test(m);
    return asksAboutProperties && asksQuantity;
}

export function wantsAssignedPropertiesOnly(message: string): boolean {
    const m = normalize(message);
    return (
        /\b(mis propiedades asignadas|propiedades asignadas|asignadas a mi|a mi cargo|que tengo asignad)\b/.test(m) &&
        !/\b(cuantas propiedades tengo|cuantas tengo|todas las propiedades)\b/.test(m)
    );
}

export function buildVerifiedPortfolioBlock(stats: unknown, countResult: unknown, listResult?: unknown): string {
    const lines = [
        'DATOS VERIFICADOS DEL PORTAFOLIO (consultados en la base de datos ahora; usa SOLO esto, nunca inventes cifras):',
        `Conteo: ${JSON.stringify(countResult)}`,
        `Estadísticas: ${JSON.stringify(stats)}`,
    ];
    if (listResult) {
        lines.push(`Listado: ${JSON.stringify(listResult)}`);
    }
    return lines.join('\n');
}
