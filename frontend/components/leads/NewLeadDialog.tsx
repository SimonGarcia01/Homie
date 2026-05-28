"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/mock/api";
import type { Lead, Property } from "@/lib/mock/db";
import { toast } from "@/hooks/use-toast";

type LeadForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  propertyId: string;
};

const emptyForm = (): LeadForm => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  propertyId: "",
});

export function NewLeadDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (lead: Lead) => void;
}) {
  const [form, setForm] = useState<LeadForm>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof LeadForm, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loadingProperties, setLoadingProperties] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm());
    setErrors({});
    setLoadingProperties(true);
    api.listProperties()
      .then(setProperties)
      .finally(() => setLoadingProperties(false));
  }, [open]);

  function validate(): boolean {
    const next: Partial<Record<keyof LeadForm, string>> = {};
    if (!form.firstName.trim()) next.firstName = "El nombre es obligatorio.";
    if (!form.lastName.trim()) next.lastName = "El apellido es obligatorio.";
    if (!form.email.trim() && !form.phone.trim()) {
      next.email = "Indica correo o teléfono.";
      next.phone = "Indica correo o teléfono.";
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Correo inválido.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const created = await api.createLead({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        propertyId: form.propertyId || undefined,
      });
      toast({
        title: "Lead sembrado",
        description: `${created.name} aparece en tu semillero.`,
      });
      onCreated?.(created);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "No se pudo crear el lead",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-primary" />
            Nuevo lead
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="lead-firstName">Nombre</Label>
              <Input
                id="lead-firstName"
                value={form.firstName}
                onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="María"
                autoFocus
              />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lead-lastName">Apellido</Label>
              <Input
                id="lead-lastName"
                value={form.lastName}
                onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder="González"
              />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-email">Correo</Label>
            <Input
              id="lead-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="maria@correo.cl"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-phone">Teléfono</Label>
            <Input
              id="lead-phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              placeholder="+56 9 1234 5678"
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
          </div>

          <div className="space-y-2">
            <Label>Propiedad de interés</Label>
            <Select
              value={form.propertyId || "__none__"}
              onValueChange={(v) => setForm((f) => ({ ...f, propertyId: v === "__none__" ? "" : v }))}
              disabled={loadingProperties}
            >
              <SelectTrigger>
                <SelectValue placeholder={loadingProperties ? "Cargando…" : "Opcional"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Sin propiedad asociada</SelectItem>
                {properties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="hero" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear lead"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
