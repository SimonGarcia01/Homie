import type { PublicProperty } from "@/lib/api/public-properties";
import { resolveMediaUrl } from "@/lib/media-url";

const unsplash = (photoId: string, width = 1200) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80`;

/** Imágenes por defecto cuando la propiedad aún no tiene fotos subidas. */
export const PROPERTY_TYPE_PLACEHOLDERS: Record<string, string> = {
  apartment: unsplash("photo-1502672260266-1c1ef2d93688"),
  house: unsplash("photo-1568605114967-8130f3a36994"),
  studio: unsplash("photo-1522708323590-d24dbb6b0267"),
  office: unsplash("photo-1497366216548-37526070297c"),
  commercial: unsplash("photo-1441986300917-64674bd600d8"),
  warehouse: unsplash("photo-1553413077-190dd305871c"),
};

export function propertyPlaceholderUrl(propertyType?: string | null): string {
  const key = propertyType?.toLowerCase() ?? "apartment";
  return PROPERTY_TYPE_PLACEHOLDERS[key] ?? PROPERTY_TYPE_PLACEHOLDERS.apartment;
}

export function getPublicPropertyCover(p: Pick<PublicProperty, "coverImageUrl" | "images" | "propertyType">): string {
  const imgs = p.images ?? [];
  const raw =
    p.coverImageUrl ?? imgs.find((i) => i.isCover)?.imageUrl ?? imgs[0]?.imageUrl ?? null;
  if (raw) return resolveMediaUrl(raw);
  return propertyPlaceholderUrl(p.propertyType);
}

export function getPublicPropertyGallery(
  p: Pick<PublicProperty, "coverImageUrl" | "images" | "propertyType">,
): string[] {
  const fromDb = (p.images ?? [])
    .map((i) => resolveMediaUrl(i.imageUrl))
    .filter(Boolean);
  if (fromDb.length > 0) return fromDb;
  const cover = p.coverImageUrl ? resolveMediaUrl(p.coverImageUrl) : "";
  if (cover) return [cover];
  return [propertyPlaceholderUrl(p.propertyType)];
}
