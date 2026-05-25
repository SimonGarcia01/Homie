"use client";

import { useEffect, useMemo, useState } from "react";
import { Sprout, Leaf, TreeDeciduous, Flower2, CheckCircle2, XCircle, Mail, Phone, ArrowRight } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/mock/api";
import type { Lead, Property } from "@/lib/mock/db";
import { cn } from "@/lib/utils";

type LeadRow = Lead & { property?: Property };

const STAGES: { key: Lead["stage"]; label: string; description: string; icon: typeof Sprout; tone: string }[] = [
  { key: "nuevo", label: "Semilla", description: "Recién llegados", icon: Sprout, tone: "primary" },
  { key: "contactado", label: "Brote", description: "Conversación iniciada", icon: Leaf, tone: "secondary" },
  { key: "visita", label: "Planta joven", description: "Visita agendada", icon: TreeDeciduous, tone: "accent" },
  { key: "aplicacion", label: "Floración", description: "Aplicación en curso", icon: Flower2, tone: "accent" },
  { key: "ganado", label: "Cosecha", description: "Convertido", icon: CheckCircle2, tone: "secondary" },
];

function initials(n: string) { return n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(); }

export default function Opportunities() {
  const [items, setItems] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listLeads().then((l) => { setItems(l); setLoading(false); });
  }, []);

  const byStage = useMemo(() => {
    const map: Record<string, LeadRow[]> = {};
    STAGES.forEach((s) => { map[s.key] = []; });
    map.perdido = [];
    items.forEach((l) => { (map[l.stage] ??= []).push(l); });
    return map;
  }, [items]);

  const total = items.filter((l) => l.stage !== "perdido" && l.stage !== "ganado").length;
  const ganados = byStage.ganado?.length ?? 0;
  const perdidos = byStage.perdido?.length ?? 0;
  const conversion = total + ganados > 0 ? Math.round((ganados / (total + ganados + perdidos)) * 100) : 0;

  return (
    <AppShell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Crecimiento</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Oportunidades</h1>
          <p className="text-muted-foreground mt-1">El pipeline visto como un jardín en distintas estaciones.</p>
        </div>
        <div className="flex gap-3">
          <StatPill label="En cultivo" value={total} />
          <StatPill label="Cosechadas" value={ganados} />
          <StatPill label="Conversión" value={`${conversion}%`} />
        </div>
      </header>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-96" />)}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
          {STAGES.map((s) => {
            const list = byStage[s.key] ?? [];
            const Icon = s.icon;
            const iconTone = { primary: "bg-primary/10 text-primary", secondary: "bg-secondary/15 text-secondary", accent: "bg-accent/15 text-accent" }[s.tone] ?? "bg-muted";
            return (
              <section key={s.key} className="rounded-2xl border border-border bg-surface/80 backdrop-blur p-4 shadow-soft">
                <header className="flex items-start gap-3 mb-4">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconTone)}><Icon className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-display text-sm font-semibold">{s.label}</h3>
                      <span className="text-xs font-display tabular-nums text-foreground/70">{list.length}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{s.description}</p>
                  </div>
                </header>
                {list.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic px-1">Sin oportunidades aquí.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {list.map((l) => (
                      <li key={l.id} className="rounded-xl border border-border/60 bg-background/60 p-3 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-leaf text-primary-foreground text-[11px] font-semibold shrink-0">{initials(l.name)}</div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate text-foreground">{l.name}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{l.property?.title ?? "Sin propiedad"}</p>
                          </div>
                        </div>
                        <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{l.email.split("@")[0]}</span>
                          <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{l.phone.slice(-7)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      {perdidos > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-surface/60 p-5">
          <header className="flex items-center gap-2 mb-3">
            <XCircle className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-display text-sm font-semibold text-foreground">Marchitas · {perdidos}</h3>
            <span className="text-xs text-muted-foreground">— Lo que no floreció también enseña.</span>
          </header>
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {byStage.perdido.map((l) => (
              <li key={l.id} className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-background/40 px-3 py-2">
                <div className="h-7 w-7 rounded-full bg-muted grid place-items-center text-[11px] font-semibold text-muted-foreground">{initials(l.name)}</div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm truncate text-foreground/80">{l.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{l.property?.title}</p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}

function StatPill({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-2.5 shadow-soft">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-lg font-semibold tabular-nums text-foreground">{value}</p>
    </div>
  );
}
