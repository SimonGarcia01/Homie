import type {
  Property,
  PropertyStatus,
  PropertyType,
  PublishStatus,
  Role,
  User,
  Owner,
} from "@/lib/mock/db";
import type { Property as BackendProperty } from "@/lib/api/properties";
import { translateAuthError } from "@/lib/auth-messages";

type ApiError = { error: string; status?: number };

export function isApiError(value: unknown): value is ApiError {
  return typeof value === "object" && value !== null && "error" in value && typeof (value as ApiError).error === "string";
}

export function unwrap<T>(result: T | ApiError): T {
  if (isApiError(result)) {
    throw new Error(translateError(result.error, result.status));
  }
  return result;
}

export function translateError(message: string, status?: number): string {
  return translateAuthError(message, status);
}

const BACKEND_TO_UI_ROLE: Record<string, Role> = {
  admin: "admin",
  coordinator: "coordinador",
  agent: "agente",
};

export function mapBackendRole(role: string): Role {
  return BACKEND_TO_UI_ROLE[role] ?? "agente";
}

const UI_TO_BACKEND_ROLE: Record<Role, string> = {
  admin: "admin",
  coordinador: "coordinator",
  agente: "agent",
  broker: "agent",
};

export function mapUiRole(role: Role): string {
  return UI_TO_BACKEND_ROLE[role];
}

const COMMERCIAL_TO_UI: Record<string, PropertyStatus> = {
  available: "disponible",
  reserved: "reservada",
  rented: "arrendada",
  inactive: "inactiva",
};

const UI_TO_COMMERCIAL: Record<PropertyStatus, string> = {
  disponible: "available",
  reservada: "reserved",
  arrendada: "rented",
  inactiva: "inactive",
};

const TYPE_TO_UI: Record<string, PropertyType> = {
  apartment: "departamento",
  house: "casa",
  studio: "departamento",
  office: "oficina",
  warehouse: "bodega",
  land: "local",
  other: "local",
};

const UI_TO_TYPE: Record<PropertyType, string> = {
  departamento: "apartment",
  casa: "house",
  oficina: "office",
  local: "other",
  bodega: "warehouse",
};

const PUBLICATION_TO_UI: Record<string, PublishStatus> = {
  draft: "borrador",
  published: "publicada",
  hidden: "pausada",
};

const UI_TO_PUBLICATION: Record<PublishStatus, string> = {
  borrador: "draft",
  publicada: "published",
  pausada: "hidden",
};

function mapCurrency(raw?: string | null): Property["currency"] {
  const c = (raw ?? "CLP").toUpperCase();
  if (c === "UF") return "UF";
  if (c === "USD") return "USD";
  return "CLP";
}

export function mapBackendProperty(p: BackendProperty): Property {
  const rent = Number.parseFloat(p.rentalDetail?.monthlyRent ?? "0") || 0;
  return {
    id: p.id,
    title: p.title,
    description: p.description ?? "",
    type: TYPE_TO_UI[p.propertyType] ?? "departamento",
    address: p.location?.address ?? "",
    city: p.location?.city ?? "",
    rent,
    currency: mapCurrency(p.rentalDetail?.currency),
    status: COMMERCIAL_TO_UI[p.commercialStatus] ?? "disponible",
    publishStatus: PUBLICATION_TO_UI[p.publicationStatus] ?? "borrador",
    bedrooms: p.feature?.bedrooms ?? 0,
    bathrooms: p.feature?.bathrooms ?? 0,
    surface: 0,
    ownerId: p.ownerId,
    agentId: "",
    createdAt: p.createdAt,
    images: p.coverImageUrl ? [p.coverImageUrl] : [],
  };
}

export function mapUiPropertyToCreate(input: Omit<Property, "id" | "createdAt">) {
  const slug = input.title
    .trim()
    .slice(0, 12)
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6);
  return {
    ownerId: input.ownerId,
    code: `HOM-${slug || "NEW"}-${Date.now().toString(36).slice(-4).toUpperCase()}`,
    title: input.title.trim(),
    description: input.description?.trim(),
    propertyType: UI_TO_TYPE[input.type] as BackendProperty["propertyType"],
    monthlyRent: input.rent,
    currency: input.currency,
    city: input.city.trim(),
    country: "Chile",
    address: input.address.trim(),
    commercialStatus: UI_TO_COMMERCIAL[input.status] as BackendProperty["commercialStatus"],
    publicationStatus: UI_TO_PUBLICATION[input.publishStatus] as BackendProperty["publicationStatus"],
    isVisible: input.publishStatus === "publicada",
    bedrooms: input.bedrooms,
    bathrooms: input.bathrooms,
  };
}

export function mapLoginUserToSafeUser(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive?: boolean;
}): Omit<User, "password"> {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: mapBackendRole(user.role),
    active: user.isActive ?? true,
    avatarColor: "primary",
  };
}

export function mapBackendOwner(option: { id: string; label: string; email: string | null; phone?: string | null }): Owner {
  return {
    id: option.id,
    name: option.label,
    email: option.email ?? "",
    phone: option.phone ?? "",
  };
}

export function mapBackendUserRow(user: {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  role?: { name: string };
}): Omit<User, "password"> {
  return {
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    role: mapBackendRole(user.role?.name ?? "agent"),
    active: user.isActive,
    avatarColor: "primary",
  };
}

const EXPENSE_CATEGORY_LABEL: Record<string, string> = {
  mantenimiento: "Mantención",
  impuesto: "Impuestos",
  servicio: "Servicios",
};

export function expenseCategoryLabel(category: string): string {
  return EXPENSE_CATEGORY_LABEL[category] ?? category;
}
