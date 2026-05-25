"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar as CalIcon, MapPin, Clock, ChevronDown, User as UserIcon, Mail, Phone, Plus, CheckCircle2, XCircle, CalendarDays } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { api } from "@/lib/mock/api";
import type { Lead, Property, Visit } from "@/lib/mock/db";
import { cn } from "@/lib/utils";

type VisitRow = Visit & { property?: Property; lead?: Lead };

const STATUS_LABEL: Record<Visit["status"], string> = {
  programada: "Programada", realizada: "Realizada", cancelada: "Cancelada",
};
const STATUS_TONE: Record<Visit["status"], string> = {
  programada: "bg-primary/10 text-primary border-primary/20",
  realizada: "bg-secondary/15 text-secondary border-secondary/20",
  cancelada: "bg-muted text-muted-foreground border-border line-through",
};

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export default function Visits() {
  const [items, setItems] = useState<VisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Date | undefined>(new Date());
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api.listVisits().then((v) => { setItems(v); setLoading(false); });
  }, []);

  const datesWithVisits = useMemo(() => items.map((v) => new Date(v.date)), [items]);

  const visitsOfDay = useMemo(() => {
    if (!selected) return [];
    return items
      .filter((v) => sameDay(new Date(v.date), selected))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [items, selected]);

  const upcoming = useMemo(() => items.filter((v) => v.status === "programada" && new Date(v.date) >= new Date()).length, [items]);
  const done = useMemo(() => items.filter((v) => v.status === "realizada").length, [items]);
  const cancel = useMemo(() => items.filter((v) => v.status === "cancelada").length, [items]);

  const labelDay = selected?.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" }) ?? "";

  return (
    <AppShell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Agenda</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Visitas</h1>
          <p className="text-muted-foreground mt-1">Cada encuentro es una oportunidad de hacer crecer la relación.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <StatPill label="Próximas" value={upcoming} tone="primary" />
          <StatPill label="Realizadas" value={done} tone="secondary" />
          <StatPill label="Canceladas" value={cancel} tone="muted" />
          <Button variant="hero" size="lg"><Plus className="h-4 w-4" /> Agendar visita</Button>
        </div>
      </header>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">
        {/* Calendar */}
        <aside className="rounded-2xl border border-border bg-surface p-4 shadow-soft h-fit">
          <div className="flex items-center gap-2 px-2 pb-3 border-b border-border/60">
            <CalendarDays className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-semibold">Calendario</h2>
          </div>
          {loading ? (
            <Skeleton className="h-80 mt-3" />
          ) : (
            <Calendar
              mode="single"
              selected={selected}
              onSelect={(d) => { setSelected(d); setOpenId(null); }}
              modifiers={{ hasVisit: datesWithVisits }}
              modifiersClassNames={{ hasVisit: "relative font-semibold text-primary after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:h-1 after:w-1 after:rounded-full after:bg-primary" }}
              className="p-2 pointer-events-auto"
              showOutsideDays
            />
          )}
          <div className="mt-3 px-2 text-xs text-muted-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Días con visitas
          </div>
        </aside>

        {/* Day detail */}
        <section className="min-w-0">
          <header className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Detalle</p>
              <h2 className="font-display text-xl font-semibold capitalize">{labelDay}</h2>
            </div>
            <p className="text-sm text-muted-foreground">{visitsOfDay.length} {visitsOfDay.length === 1 ? "visita" : "visitas"}</p>
          </header>

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
          ) : visitsOfDay.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
              <CalIcon className="h-8 w-8 mx-auto text-muted-foreground" />
              <p className="font-display text-lg mt-3">Día libre</p>
              <p className="text-muted-foreground text-sm mt-1">No hay visitas programadas para este día.</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {visitsOfDay.map((v) => {
                const d = new Date(v.date);
                const isOpen = openId === v.id;
                return (
                  <li key={v.id} className="rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
                    <Collapsible open={isOpen} onOpenChange={(o) => setOpenId(o ? v.id : null)}>
                      <CollapsibleTrigger asChild>
                        <button type="button" className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface-muted/40 transition-colors">
                          <div className="flex flex-col items-center justify-center rounded-xl bg-primary/10 text-primary px-3 py-2 shrink-0 min-w-[64px]">
                            <span className="font-display text-base font-semibold tabular-nums">{d.toLocaleString("es-CL", { hour: "2-digit", minute: "2-digit", hour12: false })}</span>
                            <span className="text-[10px] uppercase tracking-wide">{v.durationMin ?? 30} min</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-display text-base font-semibold truncate">{v.lead?.name ?? "Lead"}</p>
                              <span className={cn("text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0", STATUS_TONE[v.status])}>{STATUS_LABEL[v.status]}</span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate mt-0.5">{v.property?.title}</p>
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 truncate"><MapPin className="h-3 w-3" />{v.property?.address}, {v.property?.city}</p>
                          </div>
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform shrink-0", isOpen && "rotate-180")} />
                        </button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="border-t border-border bg-background/40 p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Interesado</p>
                            <div className="space-y-1.5 text-sm text-foreground/85">
                              <p className="flex items-center gap-2"><UserIcon className="h-3.5 w-3.5 text-muted-foreground" />{v.lead?.name}</p>
                              <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{v.lead?.email}</p>
                              <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{v.lead?.phone}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-2">Propiedad</p>
                            <div className="space-y-1.5 text-sm text-foreground/85">
                              <p className="font-medium">{v.property?.title}</p>
                              <p className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{v.property?.address}</p>
                              <p className="flex items-center gap-2 text-muted-foreground"><Clock className="h-3.5 w-3.5" />{d.toLocaleString("es-CL", { dateStyle: "medium", timeStyle: "short" })}</p>
                            </div>
                          </div>
                          {v.notes && (
                            <div className="md:col-span-2 rounded-xl bg-surface border border-border/60 p-3">
                              <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">Notas</p>
                              <p className="text-sm text-foreground/85">{v.notes}</p>
                            </div>
                          )}
                          <div className="md:col-span-2 flex flex-wrap gap-2 pt-1">
                            <Button size="sm" variant="hero" onClick={async () => { await api.updateVisit(v.id, { status: "realizada" }); setItems(await api.listVisits()); }}>
                              <CheckCircle2 className="h-4 w-4" /> Marcar como realizada
                            </Button>
                            <Button size="sm" variant="soft">Reprogramar</Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={async () => { await api.updateVisit(v.id, { status: "cancelada" }); setItems(await api.listVisits()); }}>
                              <XCircle className="h-4 w-4" /> Cancelar
                            </Button>
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}

function StatPill({ label, value, tone }: { label: string; value: React.ReactNode; tone: "primary" | "secondary" | "muted" }) {
  const cls = { primary: "text-primary", secondary: "text-secondary", muted: "text-muted-foreground" }[tone];
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-soft">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("font-display text-lg font-semibold tabular-nums", cls)}>{value}</p>
    </div>
  );
}
