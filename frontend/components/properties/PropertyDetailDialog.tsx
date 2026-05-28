import { useCallback, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  MapPin, BedDouble, Bath, Ruler, Home, ChevronLeft, ChevronRight,
  Calendar, MessageSquare, Heart, Leaf, Building2, Phone, Mail, Download, Loader2, Pencil, X, Sparkles,
} from "lucide-react";
import { generatePropertyDescription, getRentSuggestion, isAiError, type RentSuggestion } from "@/lib/api/ai";
import { cn } from "@/lib/utils";
import { resolveMediaUrl } from "@/lib/media-url";
import type { Property, Owner, PropertyStatus, PropertyType, PublishStatus } from "@/lib/mock/db";
import { api, can } from "@/lib/mock/api";
import { useAuth } from "@/contexts/AuthContext";
import { PropertyImageManager } from "@/components/properties/PropertyImageManager";
import { ScheduleVisitDialog } from "@/components/visits/ScheduleVisitDialog";
import { toast } from "@/hooks/use-toast";

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
  onPropertyUpdated,
}: {
  property: Property | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  focusPhotos?: boolean;
  onImagesUpdated?: (propertyId: string, urls: string[]) => void;
  onPropertyUpdated?: (property: Property) => void;
}) {
  const { user } = useAuth();
  const [idx, setIdx] = useState(0);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [galleryUrls, setGalleryUrls] = useState<string[]>([]);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [generatingDesc, setGeneratingDesc] = useState(false);
  const [rentSuggestion, setRentSuggestion] = useState<RentSuggestion | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    address: "",
    city: "",
    rent: 0,
    currency: "CLP" as Property["currency"],
    type: "departamento" as PropertyType,
    status: "disponible" as PropertyStatus,
    publishStatus: "borrador" as PublishStatus,
  });

  const canExportPdf = can(user?.role, "reports.view") || can(user?.role, "finances.view");

  const canManagePhotos = can(user?.role, "properties.edit");

  useEffect(() => { setIdx(0); setEditing(false); }, [property?.id]);
  useEffect(() => {
    setGalleryUrls(property?.images?.map((url) => resolveMediaUrl(url)) ?? []);
  }, [property?.id, property?.images]);

  useEffect(() => {
    if (!property) return;
    api.listOwners().then((os) => setOwner(os.find((o) => o.id === property.ownerId) ?? null));
  }, [property?.id]);

  // Debounced rent suggestion in edit mode
  useEffect(() => {
    if (!editing || !editForm.type || !editForm.city) { setRentSuggestion(null); return; }
    const timer = setTimeout(async () => {
      try {
        const result = await getRentSuggestion({ tipo: editForm.type, ciudad: editForm.city, dormitorios: property?.bedrooms, banos: property?.bathrooms });
        if (!isAiError(result) && result !== null) setRentSuggestion(result);
        else setRentSuggestion(null);
      } catch { setRentSuggestion(null); }
    }, 600);
    return () => clearTimeout(timer);
  }, [editing, editForm.type, editForm.city, property?.bedrooms, property?.bathrooms]);

  useEffect(() => {
    if (!property) return;
    setEditForm({
      title: property.title,
      description: property.description,
      address: property.address,
      city: property.city,
      rent: property.rent,
      currency: property.currency,
      type: property.type,
      status: property.status,
      publishStatus: property.publishStatus,
    });
  }, [property?.id, property?.title, property?.description, property?.address, property?.city, property?.rent, property?.currency, property?.type, property?.status, property?.publishStatus]);

  const handleImagesChange = useCallback(
    (urls: string[]) => {
      setGalleryUrls(urls);
      setIdx(0);
      if (property?.id) onImagesUpdated?.(property.id, urls);
    },
    [property?.id, onImagesUpdated],
  );

  async function handleDownloadPdf() {
    if (!property) return;
    setDownloadingPdf(true);
    try {
      await api.downloadPropertyReport(property.id);
      toast({ title: "PDF descargado" });
    } catch (err) {
      toast({
        title: "No se pudo descargar",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(false);
    }
  }

  async function handleSaveEdit() {
    if (!property) return;
    setSaving(true);
    try {
      const updated = await api.updateProperty(property.id, editForm);
      onPropertyUpdated?.(updated);
      toast({ title: "Propiedad actualizada" });
      setEditing(false);
    } catch (err) {
      toast({
        title: "No se pudo guardar",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

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
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-display text-lg font-semibold flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-primary" /> Sobre esta propiedad
                </h3>
                {canManagePhotos && !editing && (
                  <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                    <Pencil className="h-3.5 w-3.5" /> Editar
                  </Button>
                )}
              </div>
              {editing ? (
                <div className="mt-4 space-y-4 rounded-xl border border-border bg-background p-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2 sm:col-span-2">
                      <Label htmlFor="edit-title">Título</Label>
                      <Input id="edit-title" value={editForm.title} onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label htmlFor="edit-desc">Descripción</Label>
                        <button
                          type="button"
                          disabled={generatingDesc}
                          className="inline-flex items-center gap-1 text-xs text-primary hover:opacity-80 disabled:opacity-40"
                          onClick={async () => {
                            setGeneratingDesc(true);
                            try {
                              const result = await generatePropertyDescription({
                                title: editForm.title,
                                type: editForm.type,
                                city: editForm.city,
                                bedrooms: property?.bedrooms ?? 0,
                                bathrooms: property?.bathrooms ?? 0,
                                rent: editForm.rent,
                                currency: editForm.currency,
                              });
                              if (!isAiError(result)) setEditForm((f) => ({ ...f, description: result.description }));
                            } finally {
                              setGeneratingDesc(false);
                            }
                          }}
                        >
                          {generatingDesc ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                          Sugerir
                        </button>
                      </div>
                      <Textarea id="edit-desc" rows={4} value={editForm.description} onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-address">Dirección</Label>
                      <Input id="edit-address" value={editForm.address} onChange={(e) => setEditForm((f) => ({ ...f, address: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-city">Comuna</Label>
                      <Input id="edit-city" value={editForm.city} onChange={(e) => setEditForm((f) => ({ ...f, city: e.target.value }))} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-rent">Renta mensual</Label>
                      <Input id="edit-rent" type="number" min={0} value={editForm.rent || ""} onChange={(e) => setEditForm((f) => ({ ...f, rent: Number(e.target.value) || 0 }))} />
                      {rentSuggestion && (
                        <p className="text-[11px] text-muted-foreground">
                          Comparables: {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(rentSuggestion.min)} – {new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(rentSuggestion.max)} ({rentSuggestion.basedOn})
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Moneda</Label>
                      <Select value={editForm.currency} onValueChange={(v) => setEditForm((f) => ({ ...f, currency: v as Property["currency"] }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CLP">CLP</SelectItem>
                          <SelectItem value="UF">UF</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select value={editForm.type} onValueChange={(v) => setEditForm((f) => ({ ...f, type: v as PropertyType }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="departamento">Departamento</SelectItem>
                          <SelectItem value="casa">Casa</SelectItem>
                          <SelectItem value="oficina">Oficina</SelectItem>
                          <SelectItem value="local">Local comercial</SelectItem>
                          <SelectItem value="bodega">Bodega</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Estado comercial</Label>
                      <Select value={editForm.status} onValueChange={(v) => setEditForm((f) => ({ ...f, status: v as PropertyStatus }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="disponible">Disponible</SelectItem>
                          <SelectItem value="reservada">Reservada</SelectItem>
                          <SelectItem value="arrendada">Arrendada</SelectItem>
                          <SelectItem value="inactiva">Inactiva</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Estado publicación</Label>
                      <Select value={editForm.publishStatus} onValueChange={(v) => setEditForm((f) => ({ ...f, publishStatus: v as PublishStatus }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="borrador">Borrador</SelectItem>
                          <SelectItem value="publicada">Publicada</SelectItem>
                          <SelectItem value="pausada">Pausada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" size="sm" disabled={saving} onClick={() => setEditing(false)}>
                      <X className="h-3.5 w-3.5" /> Cancelar
                    </Button>
                    <Button type="button" variant="hero" size="sm" disabled={saving} onClick={() => void handleSaveEdit()}>
                      {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Guardar cambios"}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{property.description}</p>
              )}
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
                {canExportPdf && (
                  <Button variant="soft" size="lg" onClick={() => void handleDownloadPdf()} disabled={downloadingPdf}>
                    {downloadingPdf ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                    Descargar reporte PDF
                  </Button>
                )}
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
