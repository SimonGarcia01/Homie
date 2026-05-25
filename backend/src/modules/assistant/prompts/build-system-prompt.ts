import { SYSTEM_PROMPT_ES } from './system.es';

export function buildSystemPrompt(recentContextBlock?: string | null): string {
    const followUpRules = `
SEGUIMIENTO Y MEMORIA:
- Si el bloque "CONTEXTO RECIENTE" incluye propiedades, úsalo para responder preguntas como "esta", "esa", "la que mencionaste", "el nombre", "cuánto arrienda", sin inventar datos.
- Si el contexto reciente no alcanza o el usuario cambia de tema (otra ciudad, otro estado, otras propiedades), vuelve a llamar las herramientas.
- Cuando contar_propiedades devuelva propiedades en el campo "propiedades", menciona título y datos clave en tu respuesta.
- Prioriza ids del contexto reciente para obtener_propiedad cuando el usuario se refiera a una propiedad ya listada.`;

    if (!recentContextBlock?.trim()) {
        return `${SYSTEM_PROMPT_ES}\n${followUpRules}`;
    }

    return `${SYSTEM_PROMPT_ES}\n${followUpRules}\n\n${recentContextBlock.trim()}`;
}
