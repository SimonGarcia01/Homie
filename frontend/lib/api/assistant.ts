import { buildPublicApiUrl } from './api-base';
import { getAccessToken } from './auth';

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

export type AssistantChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  preview?: AssistantPropertyPreview;
};

export type AssistantChatResponse = {
  sessionId: string;
  message: string;
  preview?: AssistantPropertyPreview | null;
  toolsUsed?: string[];
  usage?: { promptTokens: number; completionTokens: number };
};

export type AssistantSendPayload = {
  sessionId?: string;
  message: string;
  messages?: AssistantChatMessage[];
};

type ApiError = { error: string; status?: number };

const SESSION_STORAGE_KEY = 'homie-assistant-session-id';

function buildApiUrl(path: string): string {
  return buildPublicApiUrl(path);
}

export function getAssistantSessionId(): string {
  if (typeof window === 'undefined') return '';
  let id = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  return id;
}

export function resetAssistantSessionId(): string {
  const id = crypto.randomUUID();
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  return id;
}

async function parseErrorResponse(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return res.statusText || 'Error de solicitud';

  try {
    const parsed = JSON.parse(text) as { message?: string | string[] };
    if (typeof parsed.message === 'string') return parsed.message;
    if (Array.isArray(parsed.message)) return parsed.message.join(', ');
    return text;
  } catch {
    return text;
  }
}

export async function sendAssistantMessage(
  payload: AssistantSendPayload,
): Promise<AssistantChatResponse | ApiError> {
  const token = getAccessToken();
  if (!token) {
    return { error: 'Sesión expirada. Inicia sesión nuevamente.', status: 401 };
  }

  const sessionId = payload.sessionId ?? getAssistantSessionId();

  const response = await fetch(buildApiUrl('/api/assistant/chat'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sessionId,
      message: payload.message,
      messages: payload.messages,
    }),
    cache: 'no-store',
  });

  if (!response.ok) {
    return { error: await parseErrorResponse(response), status: response.status };
  }

  const data = (await response.json()) as AssistantChatResponse;
  if (typeof window !== 'undefined' && data.sessionId) {
    sessionStorage.setItem(SESSION_STORAGE_KEY, data.sessionId);
  }
  return data;
}
