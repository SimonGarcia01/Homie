import { buildPublicApiUrl } from "./api-base";
import { getAccessToken } from "./auth";

type ApiError = { error: string; status?: number };

export type MessageChannel = "whatsapp" | "call" | "email" | "sms" | "note" | "other";
export type MessageDirection = "inbound" | "outbound";

export type ConversationMessage = {
  id: string;
  leadId: string;
  opportunityId?: string;
  channel: MessageChannel;
  direction: MessageDirection;
  body: string;
  userId: string;
  userName: string;
  createdAt: string;
};

export type InboxThread = {
  leadId: string;
  contactName: string;
  email: string;
  phone: string;
  stage: string;
  propertyId?: string;
  propertyTitle?: string;
  lastMessage: string;
  lastChannel: MessageChannel;
  lastDirection: MessageDirection;
  lastMessageAt: string;
  messageCount: number;
};

export type CreateMessagePayload = {
  channel: MessageChannel;
  direction: MessageDirection;
  body: string;
  opportunityId?: string;
};

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T | ApiError> {
  const token = getAccessToken();
  if (!token) return { error: "Missing access token", status: 401 };
  const res = await fetch(buildPublicApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    return { error: text || res.statusText, status: res.status };
  }
  return res.json() as Promise<T>;
}

export async function listInboxThreads(limit = 30): Promise<InboxThread[] | ApiError> {
  return requestJson<InboxThread[]>(`/api/inbox/threads?limit=${limit}`);
}

export async function listLeadMessages(leadId: string, limit = 100): Promise<ConversationMessage[] | ApiError> {
  return requestJson<ConversationMessage[]>(`/api/leads/${leadId}/messages?limit=${limit}`);
}

export async function createLeadMessage(
  leadId: string,
  payload: CreateMessagePayload,
): Promise<ConversationMessage | ApiError> {
  return requestJson<ConversationMessage>(`/api/leads/${leadId}/messages`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export const CHANNEL_LABELS: Record<MessageChannel, string> = {
  whatsapp: "WhatsApp",
  call: "Llamada",
  email: "Email",
  sms: "SMS",
  note: "Nota",
  other: "Otro",
};

export const DIRECTION_LABELS: Record<MessageDirection, string> = {
  inbound: "Entrante",
  outbound: "Saliente",
};
