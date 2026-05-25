import { buildPublicApiUrl } from "./api-base";
import { getAccessToken } from "./auth";

type ApiError = {
  error: string;
  status?: number;
};

export type BackendUserRow = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  organizationId: string;
  roleId: string;
  role?: { name: string };
};

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isApiError(value: unknown): value is ApiError {
  return isObject(value) && typeof value.error === "string";
}

async function parseErrorResponse(res: Response): Promise<string> {
  const text = await res.text();
  if (!text) return res.statusText || "Request failed";
  try {
    const parsed = JSON.parse(text) as unknown;
    if (isObject(parsed) && typeof parsed.message === "string") return parsed.message;
    if (isObject(parsed) && Array.isArray(parsed.message)) return parsed.message.join(", ");
    return text;
  } catch {
    return text;
  }
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T | ApiError> {
  const token = getAccessToken();
  if (!token) return { error: "Missing access token", status: 401 };

  const response = await fetch(buildPublicApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return { error: await parseErrorResponse(response), status: response.status };
  }

  if (response.status === 204) return {} as T;
  return (await response.json()) as T;
}

function isBackendUser(value: unknown): value is BackendUserRow {
  return (
    isObject(value) &&
    typeof value.id === "string" &&
    typeof value.email === "string" &&
    typeof value.firstName === "string" &&
    typeof value.lastName === "string" &&
    typeof value.isActive === "boolean"
  );
}

export async function listUsers(): Promise<BackendUserRow[] | ApiError> {
  const response = await requestJson<unknown[]>("/api/users");
  if (isApiError(response)) return response;
  if (!Array.isArray(response) || !response.every((item) => isBackendUser(item))) {
    return { error: "Invalid users response", status: 500 };
  }
  return response;
}

export async function toggleUserActive(userId: string, isActive: boolean): Promise<BackendUserRow | ApiError> {
  return requestJson<BackendUserRow>(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify({ isActive }),
  });
}

export async function createUser(payload: {
  organizationId: string;
  roleId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<BackendUserRow | ApiError> {
  return requestJson<BackendUserRow>("/api/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(
  userId: string,
  payload: Partial<{ firstName: string; lastName: string; email: string; roleId: string; isActive: boolean; password: string }>,
): Promise<BackendUserRow | ApiError> {
  return requestJson<BackendUserRow>(`/api/users/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}
