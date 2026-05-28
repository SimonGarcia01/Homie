import { buildPublicApiUrl } from "./api-base";
import { getAccessToken } from "./auth";

type ApiError = { error: string; status?: number };

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T | ApiError> {
  const token = getAccessToken();
  if (!token) return { error: "Missing access token", status: 401 };
  const res = await fetch(buildPublicApiUrl(path), {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    cache: "no-store",
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      const msg =
        typeof parsed.message === "string"
          ? parsed.message
          : Array.isArray(parsed.message)
            ? parsed.message.join(", ")
            : text;
      return { error: msg || res.statusText, status: res.status };
    } catch {
      return { error: text || res.statusText, status: res.status };
    }
  }
  if (res.status === 204) return {} as T;
  return res.json() as Promise<T>;
}

export type RoleRow = { id: string; name: string; description?: string };

export async function listRoles(): Promise<RoleRow[] | ApiError> {
  return requestJson<RoleRow[]>("/api/roles");
}

export type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId?: string;
  stage: string;
  createdAt: string;
};

export async function listLeads(): Promise<LeadRow[] | ApiError> {
  return requestJson<LeadRow[]>("/api/leads");
}

export async function createLead(input: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  propertyId?: string;
}): Promise<LeadRow | ApiError> {
  return requestJson<LeadRow>("/api/leads", { method: "POST", body: JSON.stringify(input) });
}

export async function contactLead(id: string): Promise<LeadRow | ApiError> {
  return requestJson<LeadRow>(`/api/leads/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "contacted" }),
  });
}

export async function convertLead(id: string, propertyId?: string): Promise<unknown | ApiError> {
  return requestJson(`/api/leads/${id}/convert`, {
    method: "POST",
    body: JSON.stringify({ propertyId, stageKey: "visita" }),
  });
}

export async function countNewLeads(): Promise<{ count: number } | ApiError> {
  return requestJson("/api/leads/counts/new");
}

export type OpportunityRow = LeadRow & { leadId?: string; status?: string };

export async function listOpportunities(): Promise<OpportunityRow[] | ApiError> {
  return requestJson<OpportunityRow[]>("/api/opportunities");
}

export async function getOpportunityBoard(): Promise<{
  pipeline: { id: string; name: string } | null;
  stages: { key: string; name: string; order: number; items: OpportunityRow[] }[];
} | ApiError> {
  return requestJson("/api/opportunities/board");
}

export async function updateOpportunityStage(id: string, stageKey: string): Promise<OpportunityRow | ApiError> {
  return requestJson<OpportunityRow>(`/api/opportunities/${id}/stage`, {
    method: "PATCH",
    body: JSON.stringify({ stageKey }),
  });
}

export type VisitRow = {
  id: string;
  propertyId: string;
  leadId?: string;
  date: string;
  status: string;
  durationMin?: number;
  notes?: string;
  contactName?: string;
};

export async function listVisits(): Promise<VisitRow[] | ApiError> {
  return requestJson<VisitRow[]>("/api/visits");
}

export async function scheduleVisit(input: {
  leadId: string;
  propertyId: string;
  scheduledAt: string;
  durationMin?: number;
  notes?: string;
  visitType?: "in_person" | "virtual";
}): Promise<VisitRow | ApiError> {
  return requestJson<VisitRow>("/api/visits/schedule", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listUpcomingVisits(): Promise<VisitRow[] | ApiError> {
  return requestJson<VisitRow[]>("/api/visits/upcoming");
}

export async function updateVisit(id: string, patch: { status?: string; scheduledAt?: string }): Promise<VisitRow | ApiError> {
  const statusMap: Record<string, string> = {
    realizada: "completed",
    cancelada: "cancelled",
    programada: "confirmed",
  };
  return requestJson<VisitRow>(`/api/visits/${id}`, {
    method: "PATCH",
    body: JSON.stringify({
      ...patch,
      status: patch.status ? statusMap[patch.status] ?? patch.status : undefined,
    }),
  });
}

export type ActivityRow = {
  id: string;
  type: string;
  message: string;
  userId: string;
  userName?: string;
  entityId?: string;
  entityLabel?: string;
  date: string;
};

export async function listActivities(limit = 8): Promise<ActivityRow[] | ApiError> {
  return requestJson<ActivityRow[]>(`/api/activities?limit=${limit}`);
}

export type DocumentRow = {
  id: string;
  name: string;
  kind: string;
  status: string;
  propertyId?: string;
  leadId?: string;
  ownerId?: string;
  uploadedAt: string;
  expiresAt?: string;
  size: string;
  downloadUrl: string;
};

export async function listDocuments(): Promise<DocumentRow[] | ApiError> {
  return requestJson<DocumentRow[]>("/api/documents");
}

export async function uploadDocument(file: File, meta?: { propertyId?: string; leadId?: string; ownerId?: string; kind?: string }) {
  const token = getAccessToken();
  if (!token) return { error: "Missing access token", status: 401 } as ApiError;
  const form = new FormData();
  form.append("file", file);
  if (meta?.propertyId) form.append("propertyId", meta.propertyId);
  if (meta?.leadId) form.append("leadId", meta.leadId);
  if (meta?.ownerId) form.append("ownerId", meta.ownerId);
  if (meta?.kind) form.append("kind", meta.kind);
  const res = await fetch(buildPublicApiUrl("/api/documents/upload"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) return { error: await res.text(), status: res.status };
  return res.json() as Promise<DocumentRow>;
}

export async function downloadDocument(id: string) {
  const token = getAccessToken();
  if (!token) throw new Error("Missing access token");
  const res = await fetch(buildPublicApiUrl(`/api/documents/${id}/download`), {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Download failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "documento";
  a.click();
  URL.revokeObjectURL(url);
}

export async function getDocumentStats(): Promise<{
  pendientes: number;
  sinVerificar: number;
  rechazados: number;
} | ApiError> {
  return requestJson("/api/documents/stats");
}

export async function countPendingApplications(): Promise<{ count: number } | ApiError> {
  return requestJson("/api/applications/counts/pending");
}

export type ApplicationRow = {
  id: string;
  opportunityId: string;
  propertyId: string;
  status: string;
  createdAt: string;
  propertyTitle?: string;
  leadName?: string;
};

export async function listApplications(status?: string): Promise<ApplicationRow[] | ApiError> {
  const qs = status ? `?status=${encodeURIComponent(status)}` : "";
  return requestJson<ApplicationRow[]>(`/api/applications${qs}`);
}

export async function updateApplicationStatus(id: string, status: string): Promise<ApplicationRow | ApiError> {
  return requestJson<ApplicationRow>(`/api/applications/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function createApplication(opportunityId: string, propertyId: string): Promise<ApplicationRow | ApiError> {
  return requestJson<ApplicationRow>("/api/applications", {
    method: "POST",
    body: JSON.stringify({ opportunityId, propertyId }),
  });
}

export type ApplicationChecklistItem = {
  id: string;
  status: string;
  documentType: { id: string; key: string; label: string };
  document?: { id: string; name: string; downloadUrl: string; status: string };
};

export type ApplicationDetail = ApplicationRow & {
  checklistItems: ApplicationChecklistItem[];
  evaluation?: {
    id: string;
    recommendation: string;
    notes?: string;
    createdAt: string;
  };
  contract?: {
    id: string;
    status: string;
    startDate: string;
    endDate: string;
    monthlyRent: string;
    signedAt?: string;
  };
  property?: { id: string; title: string };
  lead?: { id: string; name: string; email?: string };
};

export async function getApplication(id: string): Promise<ApplicationDetail | ApiError> {
  return requestJson<ApplicationDetail>(`/api/applications/${id}`);
}

export async function updateChecklistItem(
  applicationId: string,
  itemId: string,
  status: string,
): Promise<ApplicationDetail | ApiError> {
  return requestJson<ApplicationDetail>(`/api/applications/${applicationId}/checklist/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function uploadApplicationDocument(
  applicationId: string,
  checklistItemId: string,
  file: File,
  meta?: { propertyId?: string; leadId?: string; kind?: string },
): Promise<DocumentRow | ApiError> {
  const token = getAccessToken();
  if (!token) return { error: "Missing access token", status: 401 };
  const form = new FormData();
  form.append("file", file);
  form.append("applicationId", applicationId);
  form.append("checklistItemId", checklistItemId);
  if (meta?.propertyId) form.append("propertyId", meta.propertyId);
  if (meta?.leadId) form.append("leadId", meta.leadId);
  if (meta?.kind) form.append("kind", meta.kind);
  const res = await fetch(buildPublicApiUrl("/api/documents/upload"), {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as { message?: string | string[] };
      const msg =
        typeof parsed.message === "string"
          ? parsed.message
          : Array.isArray(parsed.message)
            ? parsed.message.join(", ")
            : text;
      return { error: msg || res.statusText, status: res.status };
    } catch {
      return { error: text || res.statusText, status: res.status };
    }
  }
  return res.json() as Promise<DocumentRow>;
}

export async function createEvaluation(
  applicationId: string,
  input: { recommendation: string; notes?: string },
): Promise<ApplicationDetail | ApiError> {
  return requestJson<ApplicationDetail>(`/api/applications/${applicationId}/evaluation`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createContract(
  applicationId: string,
  input: { startDate: string; endDate: string; monthlyRent: string },
): Promise<ApplicationDetail | ApiError> {
  return requestJson<ApplicationDetail>(`/api/applications/${applicationId}/contract`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateContract(
  applicationId: string,
  input: { status?: string; startDate?: string; endDate?: string; monthlyRent?: string },
): Promise<ApplicationDetail | ApiError> {
  return requestJson<ApplicationDetail>(`/api/applications/${applicationId}/contract`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateDocumentStatus(
  id: string,
  status: "approved" | "rejected" | "received" | "pending",
): Promise<DocumentRow | ApiError> {
  return requestJson<DocumentRow>(`/api/documents/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}
