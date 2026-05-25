import { SYSTEM_PROMPT_ES } from './system.es';

const CREATION_RULES = `
CREACIÓN DE PROPIEDADES (lenguaje natural):
- Si el usuario quiere agregar, registrar o crear una propiedad, extrae: título, tipo, ciudad, arriendo mensual, propietario.
- Flujo obligatorio: (1) resolver propietario con buscar_propietario o crear_propietario → (2) preparar_propiedad → (3) mostrar resumen → (4) SOLO si el usuario confirma explícitamente ("sí", "créala", "confirmo") llamar confirmar_crear_propiedad con confirmacion: true.
- NUNCA llames confirmar_crear_propiedad sin confirmación explícita del usuario.
- NUNCA digas que creaste una propiedad si confirmar_crear_propiedad no devolvió exito: true.
- Si falta un dato obligatorio, pregunta antes de preparar_propiedad.
- Montos: "850 mil" o "850000" en CLP → arriendoMensual: 850000. Confirma moneda si es ambiguo.
- Si hay varios propietarios con el mismo nombre, pide aclaración.`;

const DATA_QUERY_RULES = `
CONSULTAS DE DATOS (obligatorio):
- Para preguntas sobre cantidad, listado o existencia de propiedades DEBES usar contar_propiedades, listar_propiedades o estadisticas_portafolio.
- NUNCA digas que hay 0 propiedades o que no hay ninguna sin haber llamado una herramienta primero.
- Si el bloque "DATOS VERIFICADOS DEL PORTAFOLIO" está presente, basa tu respuesta únicamente en esos datos.`;

const FOLLOW_UP_RULES = `
SEGUIMIENTO Y MEMORIA:
- Si el bloque "CONTEXTO RECIENTE" incluye propiedades, úsalo para responder preguntas como "esta", "esa", "la que mencionaste", "el nombre", "cuánto arrienda", sin inventar datos.
- Si el contexto reciente no alcanza o el usuario cambia de tema (otra ciudad, otro estado, otras propiedades), vuelve a llamar las herramientas.
- Cuando contar_propiedades devuelva propiedades en el campo "propiedades", menciona título y datos clave en tu respuesta.
- Prioriza ids del contexto reciente para obtener_propiedad cuando el usuario se refiera a una propiedad ya listada.`;

export function buildSystemPrompt(recentContextBlock?: string | null, verifiedPortfolioBlock?: string | null): string {
    const parts = [SYSTEM_PROMPT_ES, CREATION_RULES, DATA_QUERY_RULES, FOLLOW_UP_RULES];
    if (recentContextBlock?.trim()) {
        parts.push(recentContextBlock.trim());
    }
    if (verifiedPortfolioBlock?.trim()) {
        parts.push(verifiedPortfolioBlock.trim());
    }
    return parts.join('\n');
}
