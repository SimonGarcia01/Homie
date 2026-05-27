"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarPlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/mock/api";
import type { Property } from "@/lib/mock/db";
import { toast } from "@/hooks/use-toast";

type LeadOption = {
  leadId: string;
  name: string;
  propertyId?: string;
};

function toDatetimeLocalValue(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function defaultScheduledAt(initialDate?: Date): string {
  const base = initialDate ? new Date(initialDate) : new Date();
  if (initialDate) {
    base.setHours(10, 0, 0, 0);
    if (base < new Date()) {
      base.setTime(Date.now() + 60 * 60 * 1000);
      base.setMinutes(0, 0, 0);
    }
  } else {
    base.setTime(Date.now() + 24 * 60 * 60 * 1000);
    base.setHours(10, 0, 0, 0);
  }
  return toDatetimeLocalValue(base);
}

export function ScheduleVisitDialog({
  open,
  onOpenChange,
  initialDate,
  initialPropertyId,
  initialLeadId,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date;
  initialPropertyId?: string;
  initialLeadId?: string;
  onCreated?: () => void;
}) {
  const [leadId, setLeadId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationMin, setDurationMin] = useState("45");
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leadOptions, setLeadOptions] = useState<LeadOption[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);

  useEffect(() => {
    if (!open) return;
    setLeadId(initialLeadId ?? "");
    setPropertyId(initialPropertyId ?? "");
    setScheduledAt(defaultScheduledAt(initialDate));
    setDurationMin("45");
    setNotes("");
    setErrors({});
    setLoading(true);

    Promise.all([api.listLeads(), api.listOpportunities(), api.listProperties()])
      .then(([leads, opportunities, props]) => {
        const byLead = new Map<string, LeadOption>();
        for (const lead of leads) {
          byLead.set(lead.id, {
            leadId: lead.id,
            name: lead.name,
            propertyId: lead.propertyId || undefined,
          });
        }
        for (const opp of opportunities) {
          if (!opp.leadId) continue;
          byLead.set(opp.leadId, {
            leadId: opp.leadId,
            name: opp.name,
            propertyId: opp.propertyId || byLead.get(opp.leadId)?.propertyId,
          });
        }
        setLeadOptions(Array.from(byLead.values()).sort((a, b) => a.name.localeCompare(b.name)));
        setProperties(props);
        if (initialPropertyId) setPropertyId(initialPropertyId);
        if (initialLeadId) setLeadId(initialLeadId);
      })
      .finally(() => setLoading(false));
  }, [open, initialDate, initialPropertyId, initialLeadId]);

  const selectedLead = useMemo(
    () => leadOptions.find((l) => l.leadId === leadId),
    [leadId, leadOptions],
  );

  useEffect(() => {
    if (selectedLead?.propertyId && !propertyId && !initialPropertyId) {
      setPropertyId(selectedLead.propertyId);
    }
  }, [selectedLead, propertyId, initialPropertyId]);

  function validate(): boolean {
    const next: Record<string, string> = {};
    if (!leadId) next.leadId = "Selecciona un interesado.";
    if (!propertyId) next.propertyId = "Selecciona una propiedad.";
    if (!scheduledAt) next.scheduledAt = "Indica fecha y hora.";
    if (!durationMin || Number(durationMin) < 15) next.durationMin = "Mínimo 15 minutos.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const iso = new Date(scheduledAt).toISOString();
      await api.scheduleVisit({
        leadId,
        propertyId,
        scheduledAt: iso,
        durationMin: Number(durationMin),
        notes: notes.trim() || undefined,
      });
      toast({ title: "Visita agendada", description: "Aparece en tu calendario." });
      onCreated?.();
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "No se pudo agendar",
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
            <CalendarPlus className="h-5 w-5 text-primary" />
            Agendar visita
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label>Interesado</Label>
              <Select value={leadId || "__none__"} onValueChange={(v) => setLeadId(v === "__none__" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar lead" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Seleccionar…</SelectItem>
                  {leadOptions.map((l) => (
                    <SelectItem key={l.leadId} value={l.leadId}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leadId && <p className="text-xs text-destructive">{errors.leadId}</p>}
              {leadOptions.length === 0 && (
                <p className="text-xs text-muted-foreground">Crea un lead primero en Semillero.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Propiedad</Label>
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
              {errors.propertyId && <p className="text-xs text-destructive">{errors.propertyId}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2 col-span-2 sm:col-span-1">
                <Label htmlFor="visit-datetime">Fecha y hora</Label>
                <Input
                  id="visit-datetime"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                />
                {errors.scheduledAt && <p className="text-xs text-destructive">{errors.scheduledAt}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="visit-duration">Duración (min)</Label>
                <Input
                  id="visit-duration"
                  type="number"
                  min={15}
                  step={15}
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                />
                {errors.durationMin && <p className="text-xs text-destructive">{errors.durationMin}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="visit-notes">Notas</Label>
              <Textarea
                id="visit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Llevar llaves, confirmar estacionamiento…"
                rows={2}
                className="resize-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancelar
              </Button>
              <Button type="submit" variant="hero" disabled={submitting || leadOptions.length === 0}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Agendar visita"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
