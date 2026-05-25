import { buildPublicApiUrl } from "./api-base";

type ApiError = { error: string; status?: number };

export type PublicProperty = {
  id: string;
  code: string;
  title: string;
  description?: string;
  propertyType: string;
  commercialStatus: string;
  location: { country: string; city: string; address?: string };
  feature: { bedrooms: number; bathrooms: number; isFurnished: boolean; petsAllowed: boolean };
  rentalDetail: { monthlyRent: number; currency: string };
  images: { id: string; imageUrl: string; isCover: boolean }[];
  coverImageUrl?: string;
};

export type PublicPropertyListResponse = {
  data: PublicProperty[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

function buildUrl(path: string): string {
  return buildPublicApiUrl(path);
}

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

export async function listPublicProperties(params?: {
  page?: number;
  limit?: number;
  city?: string;
  q?: string;
}): Promise<PublicPropertyListResponse | ApiError> {
  const search = new URLSearchParams();
  if (params?.page) search.set("page", String(params.page));
  if (params?.limit) search.set("limit", String(params.limit));
  if (params?.city) search.set("city", params.city);
  if (params?.q) search.set("q", params.q);
  const qs = search.toString();
  const res = await fetch(buildUrl(`/api/public/properties${qs ? `?${qs}` : ""}`));
  if (!res.ok) return { error: await parseError(res), status: res.status };
  return res.json() as Promise<PublicPropertyListResponse>;
}

export async function getPublicProperty(id: string): Promise<PublicProperty | ApiError> {
  const res = await fetch(buildUrl(`/api/public/properties/${id}`));
  if (!res.ok) return { error: await parseError(res), status: res.status };
  return res.json() as Promise<PublicProperty>;
}
