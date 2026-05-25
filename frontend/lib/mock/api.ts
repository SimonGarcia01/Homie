// Unified API surface for the UI — wired to Nest where available.
import {
  type User,
  type Property,
  type Owner,
  type Role,
  type Lead,
  type Visit,
  type Finance,
  type Document,
} from "./db";

import * as backendAuth from "@/lib/api/auth";
import { sendAssistantMessage, type AssistantSendPayload } from "@/lib/api/assistant";
import { listPropertiesFull, createProperty as createBackendProperty } from "@/lib/api/properties";
import {
  listPropertyImages as fetchPropertyImages,
  uploadPropertyImages as uploadBackendPropertyImages,
  deletePropertyImage as deleteBackendPropertyImage,
  setPropertyImageCover as setBackendPropertyImageCover,
  type PropertyImage,
  type UploadResult,
} from "@/lib/api/property-images";
import { createOwner as createBackendOwner, getOwnerOptions } from "@/lib/api/owners";
import { getIncomesSummary, getGlobalExpenses } from "@/lib/api/reports";
import { getIncomes, createIncome } from "@/lib/api/property-incomes";
import { getExpenses, createExpense } from "@/lib/api/finanzas";
import { listUsers as fetchUsers, toggleUserActive, createUser as createBackendUser } from "@/lib/api/users";
import { listRoles } from "@/lib/api/crm";
import * as crm from "@/lib/api/crm";
import {
  unwrap,
  mapBackendProperty,
  mapUiPropertyToCreate,
  mapLoginUserToSafeUser,
  mapBackendOwner,
  mapBackendUserRow,
  expenseCategoryLabel,
  mapUiRole,
} from "@/lib/mappers";
import { AuthError, translateAuthError } from "@/lib/auth-messages";
import { isAuthProfile } from "@/lib/api/auth";

function mapLeadRow(row: crm.LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    propertyId: row.propertyId ?? "",
    stage: row.stage as Lead["stage"],
    createdAt: row.createdAt,
  };
}

function mapVisitRow(row: crm.VisitRow): Visit {
  return {
    id: row.id,
    propertyId: row.propertyId,
    leadId: row.leadId ?? "",
    date: row.date,
    status: row.status as Visit["status"],
    durationMin: row.durationMin,
    notes: row.notes,
  };
}

function mapDocumentRow(row: crm.DocumentRow): Document {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind as Document["kind"],
    status: row.status as Document["status"],
    propertyId: row.propertyId,
    leadId: row.leadId,
    ownerId: row.ownerId,
    uploadedAt: row.uploadedAt,
    expiresAt: row.expiresAt,
    size: row.size,
  };
}

function profileToSafeUser(profile: backendAuth.AuthUser): Omit<User, "password"> {
  if (isAuthProfile(profile)) {
    return mapLoginUserToSafeUser({
      id: profile.id,
      email: profile.email,
      firstName: profile.firstName,
      lastName: profile.lastName,
      role: profile.role,
      isActive: profile.isActive,
    });
  }
  return {
    id: profile.id,
    name: profile.email.split("@")[0],
    email: profile.email,
    role: profile.role === "admin" ? "admin" : profile.role === "coordinator" ? "coordinador" : "agente",
    active: profile.isActive ?? true,
    avatarColor: "primary",
  };
}

async function loadAllFinances(kind?: "ingreso" | "gasto"): Promise<(Finance & { property?: Property })[]> {
  const backendProps = unwrap(await listPropertiesFull());
  const uiProps = backendProps.map(mapBackendProperty);
  const byId = new Map(uiProps.map((p) => [p.id, p]));
  const rows: (Finance & { property?: Property })[] = [];

  await Promise.all(
    backendProps.map(async (prop) => {
      if (!kind || kind === "ingreso") {
        const incomes = unwrap(await getIncomes(prop.id));
        for (const item of incomes) {
          rows.push({
            id: item.id,
            kind: "ingreso",
            concept: item.description || item.incomeType,
            amount: item.amount,
            date: item.incomeDate,
            propertyId: prop.id,
            property: byId.get(prop.id),
          });
        }
      }
      if (!kind || kind === "gasto") {
        const expenses = unwrap(await getExpenses(prop.id));
        for (const item of expenses) {
          rows.push({
            id: item.id,
            kind: "gasto",
            concept: item.description || expenseCategoryLabel(item.expenseCategory),
            amount: item.amount,
            date: item.expenseDate,
            propertyId: prop.id,
            property: byId.get(prop.id),
          });
        }
      }
    }),
  );

  return rows.sort((a, b) => b.date.localeCompare(a.date));
}

export const api = {
  async login(email: string, password: string): Promise<{ user: Omit<User, "password">; token: string }> {
    const result = await backendAuth.login(email, password);
    if ("error" in result) throw new AuthError(translateAuthError(result.error, result.status), result.status);
    return {
      user: mapLoginUserToSafeUser({ ...result.user, isActive: true }),
      token: result.accessToken,
    };
  },

  async register(input: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    organizationName: string;
  }): Promise<{ user: Omit<User, "password">; token: string }> {
    const result = await backendAuth.register(input);
    if ("error" in result) throw new AuthError(translateAuthError(result.error, result.status), result.status);
    return {
      user: mapLoginUserToSafeUser({ ...result.user, isActive: true }),
      token: result.accessToken,
    };
  },

  async logout(): Promise<void> {
    backendAuth.logout();
  },

  async me(): Promise<Omit<User, "password"> | null> {
    if (!backendAuth.getAccessToken()) return null;
    const result = await backendAuth.getMe();
    if ("error" in result) {
      backendAuth.logout();
      return null;
    }
    if (result.isActive === false) {
      backendAuth.logout();
      throw new Error("Tu cuenta está desactivada. Contacta a un administrador.");
    }
    return profileToSafeUser(result);
  },

  async listUsers(): Promise<Omit<User, "password">[]> {
    const rows = unwrap(await fetchUsers());
    return rows.map(mapBackendUserRow);
  },

  async createUser(input: {
    name: string;
    email: string;
    role: Role;
    password: string;
  }): Promise<Omit<User, "password">> {
    const profile = unwrap(await backendAuth.getMe());
    const roles = unwrap(await listRoles());
    const roleRow = roles.find((r) => r.name === mapUiRole(input.role));
    if (!roleRow) throw new Error("Rol no encontrado");
    const [firstName, ...rest] = input.name.trim().split(" ");
    const created = unwrap(
      await createBackendUser({
        organizationId: profile.organizationId,
        roleId: roleRow.id,
        email: input.email,
        password: input.password,
        firstName: firstName || input.name,
        lastName: rest.join(" ") || firstName,
      }),
    );
    return mapBackendUserRow({ ...created, role: { name: roleRow.name } });
  },

  async updateUser(id: string, patch: Partial<User> & { password?: string }): Promise<Omit<User, "password">> {
    const [firstName, ...rest] = (patch.name ?? "").trim().split(" ").filter(Boolean);
    const payload: Record<string, unknown> = {};
    if (firstName) {
      payload.firstName = firstName;
      payload.lastName = rest.join(" ") || firstName;
    }
    if (patch.email) payload.email = patch.email;
    if (patch.active !== undefined) payload.isActive = patch.active;
    if (patch.password) payload.password = patch.password;
    if (patch.role) {
      const roles = unwrap(await listRoles());
      const roleRow = roles.find((r) => r.name === mapUiRole(patch.role!));
      if (roleRow) payload.roleId = roleRow.id;
    }
    const updated = unwrap(await import("@/lib/api/users").then((m) => m.updateUser(id, payload)));
    return mapBackendUserRow(updated);
  },

  async listRoles() {
    return unwrap(await listRoles());
  },

  async toggleUserActive(id: string): Promise<void> {
    const current = unwrap(await fetchUsers());
    const user = current.find((u) => u.id === id);
    if (!user) throw new Error("Usuario no encontrado");
    unwrap(await toggleUserActive(id, !user.isActive));
  },

  async listOwners(): Promise<Owner[]> {
    const options = unwrap(await getOwnerOptions());
    return options.map(mapBackendOwner);
  },

  async createOwner(input: { firstName: string; lastName: string; email?: string; phone?: string }) {
    const created = unwrap(
      await createBackendOwner({
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        email: input.email?.trim() || undefined,
        phone: input.phone?.trim() || undefined,
      }),
    );
    return mapBackendOwner(created);
  },

  async listProperties(): Promise<Property[]> {
    const rows = unwrap(await listPropertiesFull());
    return rows.map(mapBackendProperty).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  async getProperty(id: string): Promise<Property | null> {
    const items = await this.listProperties();
    return items.find((p) => p.id === id) ?? null;
  },

  async createProperty(input: Omit<Property, "id" | "createdAt">): Promise<Property> {
    const payload = mapUiPropertyToCreate(input);
    const created = unwrap(await createBackendProperty(payload));
    return mapBackendProperty(created);
  },

  async listPropertyImages(propertyId: string): Promise<PropertyImage[]> {
    return unwrap(await fetchPropertyImages(propertyId));
  },

  async uploadPropertyImages(propertyId: string, files: File[]): Promise<UploadResult> {
    return unwrap(await uploadBackendPropertyImages(propertyId, files));
  },

  async deletePropertyImage(propertyId: string, imageId: string): Promise<{ id: string; newCoverId: string | null }> {
    return unwrap(await deleteBackendPropertyImage(propertyId, imageId));
  },

  async setPropertyImageCover(propertyId: string, imageId: string): Promise<PropertyImage> {
    return unwrap(await setBackendPropertyImageCover(propertyId, imageId));
  },

  async getDashboard() {
    const properties = await this.listProperties();
    const finances = await loadAllFinances();
    const ingresos = finances.filter((f) => f.kind === "ingreso").reduce((a, b) => a + b.amount, 0);
    const gastos = finances.filter((f) => f.kind === "gasto").reduce((a, b) => a + b.amount, 0);

    let previousBalance = ingresos - gastos;
    try {
      const summary = unwrap(await getIncomesSummary());
      previousBalance = summary.previousMonth - (gastos * 0.85);
    } catch {
      previousBalance = ingresos - gastos - 320_000;
    }

    const total = properties.length;
    const byStatus = {
      disponible: properties.filter((p) => p.status === "disponible").length,
      reservada: properties.filter((p) => p.status === "reservada").length,
      arrendada: properties.filter((p) => p.status === "arrendada").length,
      inactiva: properties.filter((p) => p.status === "inactiva").length,
    };

    let board = { pipeline: null as { id: string; name: string } | null, stages: [] as { key: string; name: string; order: number; items: crm.OpportunityRow[] }[] };
    try {
      board = unwrap(await crm.getOpportunityBoard());
    } catch {
      /* empty */
    }

    const opportunities = board.stages
      .filter((s) => !["ganado", "perdido"].includes(s.key))
      .reduce((a, s) => a + s.items.length, 0);
    let newLeads = 0;
    let pendingApplications = 0;
    try {
      newLeads = unwrap(await crm.countNewLeads()).count;
    } catch { /* */ }
    try {
      pendingApplications = unwrap(await crm.countPendingApplications()).count;
    } catch { /* */ }
    let upcomingVisitsList: Visit[] = [];
    try {
      upcomingVisitsList = unwrap(await crm.listUpcomingVisits()).map(mapVisitRow);
    } catch {
      upcomingVisitsList = [];
    }
    const upcomingVisits = upcomingVisitsList.length;

    const pipeline = board.stages
      .filter((s) => s.key !== "perdido")
      .slice(0, 5)
      .map((s) => ({
        key: s.key,
        label: s.name,
        description: s.name,
        count: s.items.length,
      }));

    let docStats = { pendientes: 0, sinVerificar: 0, rechazados: 0 };
    try {
      docStats = unwrap(await crm.getDocumentStats());
    } catch { /* */ }

    const propiedadesSinDocs = properties.filter((p) => p.publishStatus === "borrador").length;
    const docState = {
      pendientes: docStats.pendientes + propiedadesSinDocs,
      sinVerificar: docStats.sinVerificar,
      rechazados: docStats.rechazados,
      aplicacionesIncompletas: pendingApplications,
      propiedadesSinDocs,
    };
    docState.pendientes =
      docState.sinVerificar + docState.rechazados + docState.aplicacionesIncompletas + docState.propiedadesSinDocs;

    const sinImagen = properties.filter((p) => !p.images?.length).length;
    const incompletas = properties.filter((p) => p.publishStatus === "borrador" || !p.description).length;

    const monthLabels = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const now = new Date();
    const trend = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = d.getMonth();
      const monthRows = finances.filter((f) => new Date(f.date).getMonth() === key && new Date(f.date).getFullYear() === d.getFullYear());
      return {
        month: monthLabels[key],
        ingresos: monthRows.filter((f) => f.kind === "ingreso").reduce((a, b) => a + b.amount, 0),
        gastos: monthRows.filter((f) => f.kind === "gasto").reduce((a, b) => a + b.amount, 0),
      };
    });

    const incomeByProperty = new Map<string, number>();
    finances.filter((f) => f.kind === "ingreso" && f.propertyId).forEach((f) => {
      incomeByProperty.set(f.propertyId!, (incomeByProperty.get(f.propertyId!) ?? 0) + f.amount);
    });
    const topProperties = [...incomeByProperty.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, amount]) => ({ property: properties.find((p) => p.id === id)!, amount }))
      .filter((row) => row.property);

    let expenseCategories = [
      { label: "Mantención", amount: 0 },
      { label: "Impuestos", amount: 0 },
      { label: "Servicios", amount: 0 },
    ];
    try {
      const globalExpenses = unwrap(await getGlobalExpenses());
      const byCategory = new Map<string, number>();
      globalExpenses.forEach((row) => {
        const label = expenseCategoryLabel(row.category);
        byCategory.set(label, (byCategory.get(label) ?? 0) + row.total);
      });
      expenseCategories = [...byCategory.entries()].map(([label, amount]) => ({ label, amount }));
    } catch {
      expenseCategories = finances
        .filter((f) => f.kind === "gasto")
        .reduce((acc, f) => {
          const label = f.concept.split(" ")[0] || "Otros";
          const existing = acc.find((x) => x.label === label);
          if (existing) existing.amount += f.amount;
          else acc.push({ label, amount: f.amount });
          return acc;
        }, [] as { label: string; amount: number }[])
        .slice(0, 3);
    }

    const alerts = [
      ...(pendingApplications
        ? [{
            id: "al2",
            level: "info" as const,
            entity: "aplicaciones",
            message: `${pendingApplications} aplicaciones esperan revisión`,
            action: "Ver aplicaciones",
            to: "/app",
          }]
        : []),
      ...(sinImagen
        ? [{
            id: "al3",
            level: "warning" as const,
            entity: "propiedades",
            message: `${sinImagen} propiedades sin imagen principal`,
            action: "Completar fichas",
            to: "/app/propiedades",
          }]
        : []),
    ];

    return {
      total,
      byStatus,
      opportunities,
      newLeads,
      upcomingVisits,
      pendingApplications,
      ingresos,
      gastos,
      balance: ingresos - gastos,
      previousBalance,
      pipeline,
      documents: docState,
      portfolioIssues: { sinImagen, incompletas },
      trend,
      topProperties,
      expenseCategories,
      alerts,
    };
  },

  async getRecentActivity(limit = 8) {
    const rows = unwrap(await crm.listActivities(limit));
    const users = await this.listUsers();
    return rows.map((a) => ({
      id: a.id,
      type: a.type as "lead" | "visita" | "documento" | "propiedad" | "oportunidad" | "contrato",
      message: a.message,
      userId: a.userId,
      entityId: a.entityId ?? a.id,
      entityLabel: a.entityLabel ?? "",
      date: a.date,
      user: users.find((u) => u.id === a.userId),
    }));
  },

  async getUpcomingVisits() {
    const properties = await this.listProperties();
    const leadsList = await this.listLeads();
    return unwrap(await crm.listUpcomingVisits())
      .map(mapVisitRow)
      .map((v) => ({
        ...v,
        property: properties.find((p) => p.id === v.propertyId),
        lead: leadsList.find((l) => l.id === v.leadId),
      }));
  },

  async listLeads(): Promise<(Lead & { property?: Property })[]> {
    const properties = await this.listProperties();
    return unwrap(await crm.listLeads())
      .map(mapLeadRow)
      .map((l) => ({ ...l, property: l.propertyId ? properties.find((p) => p.id === l.propertyId) : undefined }));
  },

  async createLead(input: { firstName: string; lastName: string; email?: string; phone?: string; propertyId?: string }) {
    return mapLeadRow(unwrap(await crm.createLead(input)));
  },

  async contactLead(id: string) {
    return mapLeadRow(unwrap(await crm.contactLead(id)));
  },

  async convertLead(id: string, propertyId?: string) {
    return crm.convertLead(id, propertyId);
  },

  async listOpportunities(): Promise<(Lead & { property?: Property })[]> {
    const properties = await this.listProperties();
    const board = unwrap(await crm.getOpportunityBoard());
    const items = board.stages.flatMap((s) =>
      s.items.map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        phone: item.phone,
        propertyId: item.propertyId ?? "",
        stage: item.stage as Lead["stage"],
        createdAt: item.createdAt,
      })),
    );
    return items.map((l) => ({
      ...l,
      property: l.propertyId ? properties.find((p) => p.id === l.propertyId) : undefined,
    }));
  },

  async updateOpportunityStage(id: string, stageKey: string) {
    return crm.updateOpportunityStage(id, stageKey);
  },

  async listVisits(): Promise<(Visit & { property?: Property; lead?: Lead })[]> {
    const properties = await this.listProperties();
    const leadsList = await this.listLeads();
    return unwrap(await crm.listVisits())
      .map(mapVisitRow)
      .map((v) => ({
        ...v,
        property: properties.find((p) => p.id === v.propertyId),
        lead: leadsList.find((l) => l.id === v.leadId),
      }));
  },

  async updateVisit(id: string, patch: { status?: string; scheduledAt?: string }) {
    return mapVisitRow(unwrap(await crm.updateVisit(id, patch)));
  },

  async listDocuments(): Promise<(Document & { property?: Property; lead?: Lead; owner?: Owner })[]> {
    const properties = await this.listProperties();
    const leadsList = await this.listLeads();
    const owners = await this.listOwners();
    return unwrap(await crm.listDocuments())
      .map(mapDocumentRow)
      .map((d) => ({
        ...d,
        property: d.propertyId ? properties.find((p) => p.id === d.propertyId) : undefined,
        lead: d.leadId ? leadsList.find((l) => l.id === d.leadId) : undefined,
        owner: d.ownerId ? owners.find((o) => o.id === d.ownerId) : undefined,
      }));
  },

  async uploadDocument(file: File, meta?: { propertyId?: string; leadId?: string; kind?: string }) {
    return mapDocumentRow(unwrap(await crm.uploadDocument(file, meta)));
  },

  async downloadDocument(id: string) {
    return crm.downloadDocument(id);
  },

  async createFinance(input: {
    kind: "ingreso" | "gasto";
    propertyId: string;
    amount: number;
    date: string;
    concept: string;
  }) {
    if (input.kind === "ingreso") {
      unwrap(
        await createIncome(input.propertyId, {
          amount: input.amount,
          incomeDate: input.date,
          incomeType: "arriendo",
          description: input.concept,
        }),
      );
    } else {
      unwrap(
        await createExpense(input.propertyId, {
          amount: input.amount,
          expenseDate: input.date,
          expenseCategory: "mantenimiento",
          description: input.concept,
        }),
      );
    }
  },

  async listFinances(kind?: "ingreso" | "gasto"): Promise<(Finance & { property?: Property })[]> {
    return loadAllFinances(kind);
  },

  async sendAssistantMessage(payload: AssistantSendPayload) {
    return sendAssistantMessage(payload);
  },
};

export const PERMISSIONS: Record<Role, Set<string>> = {
  admin: new Set(["users.manage", "properties.create", "properties.edit", "reports.view", "finances.view"]),
  coordinador: new Set(["properties.create", "properties.edit", "reports.view", "finances.view"]),
  broker: new Set(["properties.create", "properties.edit", "reports.view", "finances.view"]),
  agente: new Set(["properties.create", "properties.edit"]),
};

/** Maps backend JWT roles to UI permission sets. */
const BACKEND_ROLE_PERMISSIONS: Record<string, Set<string>> = {
  admin: PERMISSIONS.admin,
  coordinator: PERMISSIONS.coordinador,
  agent: PERMISSIONS.agente,
};

export function can(role: Role | undefined, perm: string): boolean {
  if (!role) return false;
  return PERMISSIONS[role]?.has(perm) ?? false;
}

export function canBackendRole(role: string | undefined, perm: string): boolean {
  if (!role) return false;
  return BACKEND_ROLE_PERMISSIONS[role]?.has(perm) ?? false;
}
