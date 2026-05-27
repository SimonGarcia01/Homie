import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MapPin, BedDouble, Bath, Ruler, Home, ChevronLeft, ChevronRight,
  Calendar, MessageSquare, Heart, Leaf, Building2, Phone, Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media-url";
import type { Property, Owner } from "@/lib/mock/db";
import { api, can } from "@/lib/mock/api";
import { useAuth } from "@/contexts/AuthContext";
import { PropertyImageManager } from "@/components/properties/PropertyImageManager";
import { ScheduleVisitDialog } from "@/components/visits/ScheduleVisitDialog";

const STATUS_TONE: Record<Property["status"], string> = {
  disponible: "bg-primary/10 text-primary border-primary/20",
  reservada: "bg-accent/15 text-accent border-accent/20",
  arrendada: "bg-secondary/15 text-secondary border-secondary/20",
  inactiva: "bg-muted text-muted-foreground border-border",
};
const STATUS_LABEL: Record<Property["status"], string> = {
  disponible: "Disponible", reservada: "Reservada", arrendada: "Arrendada", inactiva: "Inactiva",
};

function formatRent(p: Property) {
  if (p.currency === "CLP")
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(p.rent);
  return `${p.rent} ${p.currency}`;
}

const TYPE_LABEL: Record<Property["type"], string> = {
  departamento: "Departamento", casa: "Casa", oficina: "Oficina", local: "Local", bodega: "Bodega",
};

export function PropertyDetailDialog({
  property,
  open,
  onOpenChange,
  focusPhotos = false,
  onImagesUpdated,
}: {
  property: Property | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  focusPhotos?: boolean;
  onImagesUpdated?: (propertyId: string, urls: string[]) => void;
}) {
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const canManagePhotos = can(user?.role, "properties.edit");

  useEffect(() => { setIdx(0); }, [property?.id]);
  useEffect(() => {
    setGalleryUrls(property?.images?.map((url) => resolveMediaUrl(url)) ?? []);
  }, [property?.id, property?.images]);

  useEffect(() => {
    if (!property) return;
    api.listOwners().then((os) => setOwner(os.find((o) => o.id === property.ownerId) ?? null));
  }, [property?.id]);

  const handleImagesChange = useCallback(
    (urls: string[]) => {
      setGalleryUrls(urls);
      setIdx(0);
      if (property?.id) onImagesUpdated?.(property.id, urls);
    },
    [property?.id, onImagesUpdated],
  );

  if (!property) return null;
  const images = galleryUrls;
  const propertyId = property.id;

  const cover = images[idx];

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl p-0 overflow-hidden border-border bg-surface gap-0 max-h-[92vh] overflow-y-auto">
        <DialogTitle className="sr-only">{property.title}</DialogTitle>

        {/* Gallery */}
        <div className="relative aspect-[16/9] md:aspect-[21/9] bg-muted overflow-hidden">
          {cover ? (
            <img src={cover} alt={property.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <Home className="h-10 w-10" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/55 via-foreground/10 to-transparent" />

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/85 backdrop-blur grid place-items-center hover:bg-background transition shadow-soft"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={() => setIdx((i) => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/85 backdrop-blur grid place-items-center hover:bg-background transition shadow-soft"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {images.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIdx(i)}
                    className={cn(
                      "h-1.5 rounded-full transition-all",
                      i === idx ? "w-6 bg-background" : "w-1.5 bg-background/60 hover:bg-background/80",
                    )}
                    aria-label={`Foto ${i + 1}`}
                  />
                ))}
              </div>
            </>
          )}

          <div className="absolute top-4 left-4 flex items-center gap-2">
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full border backdrop-blur bg-background/80", STATUS_TONE[property.status])}>
              {STATUS_LABEL[property.status]}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-border backdrop-blur bg-background/80 text-foreground inline-flex items-center gap-1">
              <Building2 className="h-3 w-3" /> {TYPE_LABEL[property.type]}
            </span>
          </div>

          <div className="absolute bottom-5 left-5 right-5 text-primary-foreground">
            <h2 className="font-display text-2xl md:text-3xl font-semibold leading-tight drop-shadow">{property.title}</h2>
            <p className="text-sm opacity-95 mt-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {property.address}, {property.city}
            </p>
          </div>
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="px-6 pt-4 flex gap-2 overflow-x-auto">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setIdx(i)}
                className={cn(
                  "relative h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden border-2 transition",
                  i === idx ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
                )}
              >
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="grid md:grid-cols-3 gap-8 px-6 py-6">
          <div className="md:col-span-2 space-y-6">
            {/* Quick facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Fact icon={BedDouble} label="Dormitorios" value={property.bedrooms || "—"} />
              <Fact icon={Bath} label="Baños" value={property.bathrooms} />
              <Fact icon={Ruler} label="Superficie" value={`${property.surface} m²`} />
              <Fact icon={Home} label="Tipo" value={TYPE_LABEL[property.type]} />
            </div>

            <PropertyImageManager
              propertyId={property.id}
              canManage={canManagePhotos}
              focusUpload={focusPhotos}
              onImagesChange={handleImagesChange}
            />

            <section>
              <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                <Leaf className="h-4 w-4 text-primary" /> Sobre esta propiedad
              </h3>
              <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{property.description}</p>
            </section>

            {property.amenities && property.amenities.length > 0 && (
              <section>
                <h3 className="font-display text-lg font-semibold">Comodidades</h3>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {property.amenities.map((a) => (
                    <li key={a} className="text-xs font-medium px-3 py-1.5 rounded-full bg-surface-muted border border-border text-foreground/80">
                      {a}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Aside — price + actions */}
          <aside className="md:sticky md:top-4 self-start space-y-4">
            <div className="rounded-2xl border border-border bg-background p-5 shadow-soft">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Arriendo mensual</p>
              <p className="font-display text-3xl text-foreground mt-1">{formatRent(property)}</p>
              <p className="text-xs text-muted-foreground mt-1">Gastos comunes no incluidos</p>

              <div className="mt-5 grid gap-2">
                <Button variant="hero" size="lg" onClick={() => setScheduleOpen(true)}>
                  <Calendar className="h-4 w-4" /> Agendar visita
                </Button>
                <Button variant="soft" size="lg"><MessageSquare className="h-4 w-4" /> Contactar interesado</Button>
                <Button variant="ghost" size="lg"><Heart className="h-4 w-4" /> Marcar como favorita</Button>
              </div>
            </div>

            {owner && (
              <div className="rounded-2xl border border-border bg-background p-5 shadow-soft">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Propietario</p>
                <p className="font-medium text-foreground mt-1">{owner.name}</p>
                <div className="mt-3 space-y-1.5 text-sm text-foreground/80">
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /> {owner.email}</p>
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {owner.phone}</p>
                </div>
              </div>
            )}
          </aside>
        </div>
      </DialogContent>
    </Dialog>

    <ScheduleVisitDialog
      open={scheduleOpen}
      onOpenChange={setScheduleOpen}
      initialPropertyId={property.id}
    />
    </>
  );
}

function Fact({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <p className="mt-1 font-display text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
