import { buildPublicApiUrl } from "./api-base";
import { getProspectAuthHeader } from "./prospect-auth";
import type { PublicProperty } from "./public-properties";

type ApiError = { error: string; status?: number };

export type ProspectInquiry = {
  id: string;
  type: "visit" | "question";
  status: string;
  statusLabel: string;
  message?: string;
  preferredTiming?: string;
  createdAt: string;
  property?: { id: string; title: string; city?: string };
  organization?: { id: string; name: string; slug: string };
};

export type ProspectApplication = {
  id: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  property?: { id: string; title: string; city?: string };
  organization?: { id: string; name: string; slug: string };
};

async function parseError(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return res.statusText || "Request failed";
  try {
    const json = JSON.parse(text) as { message?: string | string[] };
    if (Array.isArray(json.message)) return json.message.join(", ");
    if (json.message) return json.message;
  } catch {
    /* ignore */
  }
  return text;
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T | ApiError> {
  const token = getProspectAuthHeader().Authorization;
  if (!token) return { error: "Missing access token", status: 401 };
  const res = await fetch(buildPublicApiUrl(path), {
    ...init,
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });
  if (!res.ok) return { error: await parseError(res), status: res.status };
  return res.json() as Promise<T>;
}

export async function listProspectFavorites(): Promise<PublicProperty[] | ApiError> {
  return requestJson<PublicProperty[]>("/api/prospect/favorites");
}

export async function addProspectFavorite(propertyId: string): Promise<PublicProperty | ApiError> {
  return requestJson<PublicProperty>(`/api/prospect/favorites/${propertyId}`, { method: "POST" });
}

export async function removeProspectFavorite(propertyId: string): Promise<{ id: string } | ApiError> {
  return requestJson<{ id: string }>(`/api/prospect/favorites/${propertyId}`, { method: "DELETE" });
}

export async function getProspectFavoriteStatus(propertyId: string): Promise<{ isFavorite: boolean } | ApiError> {
  return requestJson<{ isFavorite: boolean }>(`/api/prospect/favorites/${propertyId}/status`);
}

export async function listProspectInquiries(): Promise<ProspectInquiry[] | ApiError> {
  return requestJson<ProspectInquiry[]>("/api/prospect/inquiries");
}

export async function listProspectApplications(): Promise<ProspectApplication[] | ApiError> {
  return requestJson<ProspectApplication[]>("/api/prospect/applications");
}

export async function createProspectInquiry(input: {
  propertyId: string;
  type: "visit" | "question";
  message?: string;
  preferredTiming?: string;
}): Promise<ProspectInquiry | ApiError> {
  return requestJson<ProspectInquiry>("/api/prospect/inquiries", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
