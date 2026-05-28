import { buildPublicApiUrl } from "./api-base";
import { getAccessToken } from "./auth";

type ApiError = { error: string; status?: number };

function buildUrl(path: string) {
  return buildPublicApiUrl(path);
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T | ApiError> {
  const token = getAccessToken();
  if (!token) return { error: "Sesión expirada", status: 401 };

  const res = await fetch(buildUrl(path), {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers ?? {}),
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { message?: string };
      return { error: parsed.message ?? res.statusText, status: res.status };
    } catch {
      return { error: text || res.statusText, status: res.status };
    }
  }

  return res.json() as Promise<T>;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export type DocumentKind = "contrato" | "cedula" | "comprobante" | "garantia" | "otro";

export type LeadScoreSignal = "hot" | "warm" | "cold";

export type LeadScore = {
  leadId: string;
  score: number;
  signal: LeadScoreSignal;
  reason: string;
};

export type RentSuggestion = {
  min: number;
  max: number;
  suggested: number;
  currency: string;
  basedOn: number;
};

export type WeeklyDigest = {
  summary: string;
  generatedAt: string;
  weekLabel: string;
};

export type VisitBrief = {
  propertyHighlights: string;
  leadProfile: string;
  talkingPoints: string[];
};

// ─── 1. Property description ────────────────────────────────────────────────
export async function generatePropertyDescription(params: {
  title: string;
  type: string;
  city: string;
  bedrooms: number;
  bathrooms: number;
  rent: number;
  currency: string;
}): Promise<{ description: string } | ApiError> {
  return apiFetch("/api/ai/property-description", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

// ─── 2. Smart reply ──────────────────────────────────────────────────────────
export async function generateSmartReply(
  leadId: string,
): Promise<{ draft: string } | ApiError> {
  return apiFetch("/api/ai/smart-reply", {
    method: "POST",
    body: JSON.stringify({ leadId }),
  });
}

// ─── 3. Document classification ──────────────────────────────────────────────
export async function classifyDocument(
  filename: string,
  mimeType?: string,
): Promise<{ kind: DocumentKind; confidence: "high" | "low" } | ApiError> {
  return apiFetch("/api/ai/classify-document", {
    method: "POST",
    body: JSON.stringify({ filename, mimeType }),
  });
}

// ─── 4. Lead scoring ─────────────────────────────────────────────────────────
export async function batchLeadScores(
  leadIds: string[],
): Promise<{ scores: LeadScore[] } | ApiError> {
  return apiFetch("/api/ai/lead-scores", {
    method: "POST",
    body: JSON.stringify({ leadIds }),
  });
}

// ─── 5. Rent suggestion ───────────────────────────────────────────────────────
export async function getRentSuggestion(params: {
  tipo: string;
  ciudad: string;
  dormitorios?: number;
  banos?: number;
}): Promise<RentSuggestion | null | ApiError> {
  const qs = new URLSearchParams({ tipo: params.tipo, ciudad: params.ciudad });
  if (params.dormitorios !== undefined)
    qs.set("dormitorios", String(params.dormitorios));
  if (params.banos !== undefined) qs.set("banos", String(params.banos));
  return apiFetch(`/api/ai/rent-suggestion?${qs.toString()}`);
}

// ─── 6. Weekly digest ────────────────────────────────────────────────────────
export async function getWeeklyDigest(
  force = false,
): Promise<WeeklyDigest | ApiError> {
  return apiFetch(`/api/ai/weekly-digest${force ? "?force=true" : ""}`);
}

// ─── 7. Visit briefing ───────────────────────────────────────────────────────
export async function getVisitBrief(
  visitId: string,
): Promise<VisitBrief | ApiError> {
  return apiFetch(`/api/ai/visit-brief/${visitId}`);
}

// ─── Helper ───────────────────────────────────────────────────────────────────
export function isAiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as ApiError).error === "string"
  );
}
