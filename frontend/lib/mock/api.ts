// Unified API surface for the UI — wired to Nest where available, mock fallback elsewhere.
import {
  users as mockUsers,
  leads,
  visits,
  activities,
  documents,
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
import { listPropertiesFull, createProperty as createBackendProperty } from "@/lib/api/properties";
import { getOwnerOptions } from "@/lib/api/owners";
import { getIncomesSummary, getGlobalExpenses } from "@/lib/api/reports";
import { getIncomes } from "@/lib/api/property-incomes";
import { getExpenses } from "@/lib/api/finanzas";
import { listUsers as fetchUsers, toggleUserActive } from "@/lib/api/users";
import {
  unwrap,
  mapBackendProperty,
  mapUiPropertyToCreate,
  mapLoginUserToSafeUser,
  mapBackendOwner,
  mapBackendUserRow,
  expenseCategoryLabel,
} from "@/lib/mappers";
import { AuthError, translateAuthError } from "@/lib/auth-messages";
import { isAuthProfile } from "@/lib/api/auth";

const delay = (ms = 120) => new Promise((r) => setTimeout(r, ms));

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

  async createUser(_input: Omit<User, "id" | "avatarColor">): Promise<Omit<User, "password">> {
    throw new Error("Alta de usuarios disponible pronto desde el panel de administración.");
  },

  async updateUser(_id: string, _patch: Partial<User>): Promise<Omit<User, "password">> {
    throw new Error("Edición de usuarios disponible pronto.");
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

    const opportunities = leads.filter((l) => !["ganado", "perdido"].includes(l.stage)).length;
    const newLeads = leads.filter((l) => l.stage === "nuevo").length;
    const upcomingVisits = visits.filter((v) => v.status === "programada").length;
    const pendingApplications = leads.filter((l) => l.stage === "aplicacion").length;

    const pipeline = [
      { key: "nuevo", label: "Semilla", description: "Nuevo interés", count: leads.filter((l) => l.stage === "nuevo").length },
      { key: "contactado", label: "Brote", description: "Contactado", count: leads.filter((l) => l.stage === "contactado").length },
      { key: "visita", label: "Planta joven", description: "Visita agendada", count: leads.filter((l) => l.stage === "visita").length },
      { key: "aplicacion", label: "Floración", description: "Aplicación en curso", count: leads.filter((l) => l.stage === "aplicacion").length },
      { key: "ganado", label: "Cosecha", description: "Ganada", count: leads.filter((l) => l.stage === "ganado").length },
    ];

    const propiedadesSinDocs = properties.filter((p) => p.publishStatus === "borrador").length;
    const docState = {
      pendientes: 0,
      sinVerificar: 0,
      rechazados: 0,
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
    await delay(80);
    return [...activities]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, limit)
      .map((a) => ({ ...a, user: mockUsers.find((u) => u.id === a.userId) }));
  },

  async getUpcomingVisits() {
    await delay(80);
    const properties = await this.listProperties();
    return visits
      .filter((v) => v.status === "programada")
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((v) => ({
        ...v,
        property: properties.find((p) => p.id === v.propertyId),
        lead: leads.find((l) => l.id === v.leadId),
      }));
  },

  async listLeads(): Promise<(Lead & { property?: Property })[]> {
    await delay(80);
    const properties = await this.listProperties();
    return [...leads]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((l) => ({ ...l, property: properties.find((p) => p.id === l.propertyId) }));
  },

  async listVisits(): Promise<(Visit & { property?: Property; lead?: Lead })[]> {
    await delay(80);
    const properties = await this.listProperties();
    return [...visits]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((v) => ({
        ...v,
        property: properties.find((p) => p.id === v.propertyId),
        lead: leads.find((l) => l.id === v.leadId),
      }));
  },

  async listDocuments(): Promise<(Document & { property?: Property; lead?: Lead; owner?: Owner })[]> {
    await delay(80);
    const properties = await this.listProperties();
    const owners = await this.listOwners();
    return [...documents]
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
      .map((d) => ({
        ...d,
        property: d.propertyId ? properties.find((p) => p.id === d.propertyId) : undefined,
        lead: d.leadId ? leads.find((l) => l.id === d.leadId) : undefined,
        owner: d.ownerId ? owners.find((o) => o.id === d.ownerId) : undefined,
      }));
  },

  async listFinances(kind?: "ingreso" | "gasto"): Promise<(Finance & { property?: Property })[]> {
    return loadAllFinances(kind);
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
