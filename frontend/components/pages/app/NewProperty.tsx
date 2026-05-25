"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Plus, Sprout, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/mock/api";
import type { Owner, Property, PropertyType, PropertyStatus, PublishStatus } from "@/lib/mock/db";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

const CREATE_OWNER_VALUE = "__create_owner__";

type OwnerForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

const emptyOwnerForm = (): OwnerForm => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
});

export default function NewProperty() {
  const { user } = useAuth();
  const router = useRouter();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [ownersLoading, setOwnersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [ownerDialogOpen, setOwnerDialogOpen] = useState(false);
  const [ownerForm, setOwnerForm] = useState<OwnerForm>(emptyOwnerForm);
  const [ownerFormErrors, setOwnerFormErrors] = useState<Partial<Record<keyof OwnerForm, string>>>({});
  const [creatingOwner, setCreatingOwner] = useState(false);

  const [form, setForm] = useState<Omit<Property, "id" | "createdAt">>({
    title: "",
    description: "",
    type: "departamento",
    address: "",
    city: "",
    rent: 0,
    currency: "CLP",
    status: "disponible",
    publishStatus: "borrador",
    bedrooms: 1,
    bathrooms: 1,
    surface: 0,
    ownerId: "",
    agentId: user?.id ?? "",
  });

  const loadOwners = useCallback(async () => {
    setOwnersLoading(true);
    try {
      setOwners(await api.listOwners());
    } finally {
      setOwnersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOwners();
  }, [loadOwners]);

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Pon un título descriptivo.";
    if (!form.address.trim()) e.address = "La dirección es obligatoria.";
    if (!form.city.trim()) e.city = "La comuna es obligatoria.";
    if (!form.ownerId) e.ownerId = "Selecciona o crea un propietario.";
    if (!form.rent || form.rent <= 0) e.rent = "El canon debe ser mayor a cero.";
    if (form.surface <= 0) e.surface = "Indica los metros cuadrados.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function validateOwnerForm(): boolean {
    const e: Partial<Record<keyof OwnerForm, string>> = {};
    if (!ownerForm.firstName.trim()) e.firstName = "El nombre es obligatorio.";
    if (!ownerForm.lastName.trim()) e.lastName = "El apellido es obligatorio.";
    if (ownerForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerForm.email.trim())) {
      e.email = "Correo inválido.";
    }
    setOwnerFormErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleCreateOwner(e: FormEvent) {
    e.preventDefault();
    if (!validateOwnerForm()) return;

    setCreatingOwner(true);
    try {
      const created = await api.createOwner(ownerForm);
      await loadOwners();
      set("ownerId", created.id);
      setErrors((prev) => {
        const next = { ...prev };
        delete next.ownerId;
        return next;
      });
      setOwnerDialogOpen(false);
      setOwnerForm(emptyOwnerForm());
      setOwnerFormErrors({});
      toast({ title: "Propietario agregado", description: `${created.name} quedó seleccionado.` });
    } catch (err) {
      toast({
        title: "No se pudo crear el propietario",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setCreatingOwner(false);
    }
  }

  function openOwnerDialog() {
    setOwnerForm(emptyOwnerForm());
    setOwnerFormErrors({});
    setOwnerDialogOpen(true);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const created = await api.createProperty(form);
      toast({
        title: "Propiedad sembrada 🌱",
        description: "Agrega fotos para completar la ficha.",
      });
      router.push(`/app/propiedades?open=${created.id}&photos=1`);
    } catch (err) {
      toast({ title: "No se pudo guardar", description: err instanceof Error ? err.message : "Intenta de nuevo." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <Link href="/app/propiedades" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Volver a propiedades
      </Link>

      <header className="mt-4 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-leaf text-primary-foreground shadow-soft">
          <Sprout className="h-5 w-5" />
        </span>
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">Sembrar propiedad</h1>
          <p className="text-muted-foreground text-sm">Cuanta más información, mejor cuidaremos esta semilla.</p>
        </div>
      </header>

      <form onSubmit={onSubmit} className="mt-8 max-w-3xl space-y-8" noValidate>
        <Section title="Lo esencial">
          <Field label="Título" id="title" error={errors.title}>
            <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Ej: Departamento luminoso en Providencia" />
          </Field>
          <Field label="Descripción" id="description">
            <Textarea id="description" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Cuéntanos qué hace especial esta propiedad…" />
          </Field>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Tipo" id="type">
              <Select value={form.type} onValueChange={(v) => set("type", v as PropertyType)}>
                <SelectTrigger id="type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="departamento">Departamento</SelectItem>
                  <SelectItem value="casa">Casa</SelectItem>
                  <SelectItem value="oficina">Oficina</SelectItem>
                  <SelectItem value="local">Local comercial</SelectItem>
                  <SelectItem value="bodega">Bodega</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field
              label="Propietario"
              id="owner"
              error={errors.ownerId}
              action={
                <Button type="button" variant="link" className="h-auto p-0 text-xs" onClick={openOwnerDialog}>
                  <Plus className="h-3 w-3" /> Agregar propietario
                </Button>
              }
            >
              {ownersLoading ? (
                <p className="text-sm text-muted-foreground py-2">Cargando propietarios…</p>
              ) : owners.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface-muted/50 p-4 text-center space-y-3">
                  <p className="text-sm text-muted-foreground">Aún no hay propietarios registrados.</p>
                  <Button type="button" variant="soft" size="sm" onClick={openOwnerDialog}>
                    <UserPlus className="h-4 w-4" /> Crear primer propietario
                  </Button>
                </div>
              ) : (
                <Select
                  value={form.ownerId || undefined}
                  onValueChange={(v) => {
                    if (v === CREATE_OWNER_VALUE) {
                      openOwnerDialog();
                      return;
                    }
                    set("ownerId", v);
                  }}
                >
                  <SelectTrigger id="owner"><SelectValue placeholder="Selecciona…" /></SelectTrigger>
                  <SelectContent>
                    {owners.map((o) => (
                      <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                    ))}
                    <SelectItem value={CREATE_OWNER_VALUE} className="text-primary font-medium">
                      + Nuevo propietario
                    </SelectItem>
                  </SelectContent>
                </Select>
              )}
            </Field>
          </div>
        </Section>

        <Section title="Ubicación">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Dirección" id="address" error={errors.address}>
              <Input id="address" value={form.address} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Comuna" id="city" error={errors.city}>
              <Input id="city" value={form.city} onChange={(e) => set("city", e.target.value)} />
            </Field>
          </div>
        </Section>

        <Section title="Detalles del arriendo">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Field label="Canon" id="rent" error={errors.rent}>
              <Input id="rent" type="number" min={0} value={form.rent || ""} onChange={(e) => set("rent", Number(e.target.value))} />
            </Field>
            <Field label="Moneda" id="currency">
              <Select value={form.currency} onValueChange={(v) => set("currency", v as Property["currency"])}>
                <SelectTrigger id="currency"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLP">CLP</SelectItem>
                  <SelectItem value="UF">UF</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Dormitorios" id="beds">
              <Input id="beds" type="number" min={0} value={form.bedrooms} onChange={(e) => set("bedrooms", Number(e.target.value))} />
            </Field>
            <Field label="Baños" id="baths">
              <Input id="baths" type="number" min={0} value={form.bathrooms} onChange={(e) => set("bathrooms", Number(e.target.value))} />
            </Field>
            <Field label="Superficie (m²)" id="surface" error={errors.surface}>
              <Input id="surface" type="number" min={0} value={form.surface || ""} onChange={(e) => set("surface", Number(e.target.value))} />
            </Field>
            <Field label="Estado comercial" id="status">
              <Select value={form.status} onValueChange={(v) => set("status", v as PropertyStatus)}>
                <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="disponible">Disponible</SelectItem>
                  <SelectItem value="reservada">Reservada</SelectItem>
                  <SelectItem value="arrendada">Arrendada</SelectItem>
                  <SelectItem value="inactiva">Inactiva</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Publicación" id="publish">
              <Select value={form.publishStatus} onValueChange={(v) => set("publishStatus", v as PublishStatus)}>
                <SelectTrigger id="publish"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="publicada">Publicada</SelectItem>
                  <SelectItem value="pausada">Pausada</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="hero" size="lg" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar propiedad"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.push("/app/propiedades")}>Cancelar</Button>
        </div>
      </form>

      <Dialog open={ownerDialogOpen} onOpenChange={setOwnerDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Nuevo propietario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreateOwner} className="space-y-4 mt-2" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre" id="owner-first" error={ownerFormErrors.firstName}>
                <Input
                  id="owner-first"
                  value={ownerForm.firstName}
                  onChange={(e) => setOwnerForm((f) => ({ ...f, firstName: e.target.value }))}
                  placeholder="María"
                  autoFocus
                />
              </Field>
              <Field label="Apellido" id="owner-last" error={ownerFormErrors.lastName}>
                <Input
                  id="owner-last"
                  value={ownerForm.lastName}
                  onChange={(e) => setOwnerForm((f) => ({ ...f, lastName: e.target.value }))}
                  placeholder="González"
                />
              </Field>
            </div>
            <Field label="Correo (opcional)" id="owner-email" error={ownerFormErrors.email}>
              <Input
                id="owner-email"
                type="email"
                value={ownerForm.email}
                onChange={(e) => setOwnerForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="maria@ejemplo.cl"
              />
            </Field>
            <Field label="Teléfono (opcional)" id="owner-phone">
              <Input
                id="owner-phone"
                value={ownerForm.phone}
                onChange={(e) => setOwnerForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+56 9 1234 5678"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setOwnerDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="hero" disabled={creatingOwner}>
                {creatingOwner ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar propietario"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-6 shadow-soft space-y-4">
      <h2 className="font-display text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

function Field({
  label,
  id,
  error,
  action,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {action}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
