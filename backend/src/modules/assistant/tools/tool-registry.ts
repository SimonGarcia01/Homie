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

const PREPARAR_PROPIEDAD_PARAMS = {
    type: 'object' as const,
    properties: {
        titulo: { type: 'string', description: 'Título descriptivo de la propiedad' },
        tipo: { type: 'string', description: 'casa, departamento, oficina, bodega, terreno, otro' },
        propietarioId: { type: 'string', description: 'UUID del propietario si ya se conoce' },
        propietarioNombre: { type: 'string', description: 'Nombre del propietario para buscar' },
        arriendoMensual: { type: 'number', description: 'Canon mensual en la moneda indicada' },
        moneda: { type: 'string', description: 'CLP, UF o USD. Default CLP' },
        ciudad: { type: 'string', description: 'Comuna o ciudad' },
        pais: { type: 'string', description: 'País. Default Chile' },
        direccion: { type: 'string', description: 'Dirección' },
        dormitorios: { type: 'number' },
        banos: { type: 'number' },
        estadoComercial: { type: 'string', description: 'disponible, arrendada, reservada, inactiva' },
        estadoPublicacion: { type: 'string', description: 'borrador, publicada, pausada' },
        descripcion: { type: 'string' },
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
    {
        type: 'function',
        function: {
            name: 'buscar_propietario',
            description: 'Busca propietarios por nombre o correo antes de crear una propiedad.',
            parameters: {
                type: 'object',
                properties: {
                    busqueda: { type: 'string', description: 'Nombre, apellido o email del propietario' },
                },
                required: ['busqueda'],
                additionalProperties: false,
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'crear_propietario',
            description: 'Crea un propietario nuevo si no existe en el sistema.',
            parameters: {
                type: 'object',
                properties: {
                    nombre: { type: 'string' },
                    apellido: { type: 'string' },
                    nombreCompleto: { type: 'string', description: 'Alternativa a nombre + apellido' },
                    email: { type: 'string' },
                    telefono: { type: 'string' },
                },
                additionalProperties: false,
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'preparar_propiedad',
            description:
                'Valida datos y prepara borrador de propiedad SIN guardar. Devuelve vistaPrevia. Siempre pedir confirmación al usuario antes de crear.',
            parameters: PREPARAR_PROPIEDAD_PARAMS,
        },
    },
    {
        type: 'function',
        function: {
            name: 'confirmar_crear_propiedad',
            description:
                'Crea la propiedad en la base de datos SOLO después de confirmación explícita del usuario (sí, créala, confirmo, etc.).',
            parameters: {
                type: 'object',
                properties: {
                    confirmacion: {
                        type: 'boolean',
                        description: 'Debe ser true solo si el usuario confirmó explícitamente',
                    },
                },
                required: ['confirmacion'],
                additionalProperties: false,
            },
        },
    },
];

export type AssistantToolName =
    | 'contar_propiedades'
    | 'listar_propiedades'
    | 'obtener_propiedad'
    | 'estadisticas_portafolio'
    | 'contexto_usuario'
    | 'buscar_propietario'
    | 'crear_propietario'
    | 'preparar_propiedad'
    | 'confirmar_crear_propiedad';

export type AssistantPropertyPreview = {
    titulo: string;
    tipo: string;
    propietario: string;
    propietarioId: string;
    arriendoMensual: number;
    moneda: string;
    ciudad: string;
    pais: string;
    direccion: string | null;
    dormitorios: number;
    banos: number;
    estadoComercial: string;
    estadoPublicacion: string;
    codigoPropuesto: string;
    descripcion: string | null;
};
