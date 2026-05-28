"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export function ConvertLeadDialog({
  lead,
  open,
  onOpenChange,
  onConverted,
}: {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConverted?: () => void;
}) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertyId, setPropertyId] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !lead) return;
    setPropertyId(lead.propertyId ?? "");
    setLoading(true);
    api.listProperties()
      .then(setProperties)
      .finally(() => setLoading(false));
  }, [open, lead]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!lead || !propertyId) return;

    setSubmitting(true);
    try {
      await api.convertLead(lead.id, propertyId);
      toast({
        title: "Oportunidad creada",
        description: `${lead.name} pasó al pipeline en etapa Visita.`,
      });
      onConverted?.();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "No se pudo convertir",
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
            <Sprout className="h-5 w-5 text-primary" />
            Convertir a oportunidad
          </DialogTitle>
        </DialogHeader>
        {lead && (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <p className="text-sm text-muted-foreground">
              Se creará una oportunidad para <strong className="text-foreground">{lead.name}</strong> en etapa Visita.
            </p>
            <div className="space-y-2">
              <Label>Propiedad</Label>
              {loading ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
                </div>
              ) : (
                <Select value={propertyId || "__none__"} onValueChange={(v) => setPropertyId(v === "__none__" ? "" : v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar propiedad" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Seleccionar…</SelectItem>
                    {properties.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" variant="hero" disabled={submitting || !propertyId}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Convertir"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
