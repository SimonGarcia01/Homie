import type { ChatCompletionTool } from 'openai/resources/chat/completions';

const FILTER_PROPERTIES = {
    type: 'object' as const,
    properties: {
        tipo: {
            type: 'string',
            description: 'Tipo de propiedad: casa, departamento, oficina, bodega, terreno, otro',
        },
        estadoComercial: {
            type: 'string',
            description: 'Estado comercial: disponible, arrendada, reservada, inactiva',
        },
        estadoPublicacion: {
            type: 'string',
            description: 'Estado de publicación: publicada, borrador, pausada',
        },
        ciudad: { type: 'string', description: 'Ciudad (búsqueda parcial)' },
        pais: { type: 'string', description: 'País (búsqueda parcial)' },
        arriendoMinimo: { type: 'number', description: 'Arriendo mensual mínimo' },
        arriendoMaximo: { type: 'number', description: 'Arriendo mensual máximo' },
        busqueda: { type: 'string', description: 'Texto para buscar en título o código' },
        assignedToMe: {
            type: 'boolean',
            description: 'Si true, solo propiedades asignadas al usuario actual',
        },
    },
    additionalProperties: false,
};

export const ASSISTANT_TOOLS: ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'contar_propiedades',
            description: 'Cuenta cuántas propiedades hay en el portafolio con filtros opcionales.',
            parameters: FILTER_PROPERTIES,
        },
    },
    {
        type: 'function',
        function: {
            name: 'listar_propiedades',
            description: 'Lista propiedades del portafolio con filtros opcionales (máximo 20 resultados).',
            parameters: {
                type: 'object',
                properties: {
                    ...FILTER_PROPERTIES.properties,
                    limite: { type: 'number', description: 'Cantidad máxima de resultados (1-20)' },
                },
                additionalProperties: false,
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'obtener_propiedad',
            description: 'Obtiene el detalle de una propiedad por UUID o código interno, o busca por texto.',
            parameters: {
                type: 'object',
                properties: {
                    id: { type: 'string', description: 'UUID de la propiedad' },
                    codigo: { type: 'string', description: 'Código interno de la propiedad' },
                    busqueda: { type: 'string', description: 'Texto para buscar si no se conoce el id' },
                },
                additionalProperties: false,
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'estadisticas_portafolio',
            description: 'Resumen agregado del portafolio: totales por estado comercial, tipo y ciudades principales.',
            parameters: {
                type: 'object',
                properties: {
                    assignedToMe: {
                        type: 'boolean',
                        description: 'Si true, solo propiedades asignadas al usuario actual',
                    },
                },
                additionalProperties: false,
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'contexto_usuario',
            description: 'Obtiene información del usuario autenticado (nombre, rol) para contextualizar respuestas.',
            parameters: { type: 'object', properties: {}, additionalProperties: false },
        },
    },
];

export type AssistantToolName =
    | 'contar_propiedades'
    | 'listar_propiedades'
    | 'obtener_propiedad'
    | 'estadisticas_portafolio'
    | 'contexto_usuario';
