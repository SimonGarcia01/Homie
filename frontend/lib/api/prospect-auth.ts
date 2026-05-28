import { buildPublicApiUrl } from "./api-base";

const PROSPECT_TOKEN_KEY = "prospectAccessToken";

type ApiError = { error: string; status?: number };

export type ProspectUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
};

type AuthSuccess = { accessToken: string; user: ProspectUser };

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

export function saveProspectToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROSPECT_TOKEN_KEY, token);
}

export function getProspectToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(PROSPECT_TOKEN_KEY);
}

export function clearProspectToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(PROSPECT_TOKEN_KEY);
}

export function getProspectAuthHeader(): Record<string, string> {
  const token = getProspectToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function prospectRegister(input: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
}): Promise<AuthSuccess | ApiError> {
  const res = await fetch(buildPublicApiUrl("/api/prospect/auth/register"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return { error: await parseError(res), status: res.status };
  const data = (await res.json()) as AuthSuccess;
  saveProspectToken(data.accessToken);
  return data;
}

export async function prospectLogin(email: string, password: string): Promise<AuthSuccess | ApiError> {
  const res = await fetch(buildPublicApiUrl("/api/prospect/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) return { error: await parseError(res), status: res.status };
  const data = (await res.json()) as AuthSuccess;
  saveProspectToken(data.accessToken);
  return data;
}

export async function prospectMe(): Promise<ProspectUser | ApiError> {
  const token = getProspectToken();
  if (!token) return { error: "Missing access token", status: 401 };
  const res = await fetch(buildPublicApiUrl("/api/prospect/auth/me"), {
    headers: { ...getProspectAuthHeader(), "Content-Type": "application/json" },
    cache: "no-store",
  });
  if (!res.ok) return { error: await parseError(res), status: res.status };
  return res.json() as Promise<ProspectUser>;
}

export async function prospectLogout(): Promise<void> {
  clearProspectToken();
}
