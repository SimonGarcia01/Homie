"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sprout, Search, Mail, Phone, Home as HomeIcon, Plus, ArrowRight, Flame, Snowflake, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/mock/api";
import type { Lead, Property } from "@/lib/mock/db";
import { cn } from "@/lib/utils";
import { LeadConversationDialog } from "@/components/conversations/LeadConversationDialog";
import type { LeadConversationTarget } from "@/components/conversations/LeadConversationPanel";
import { NewLeadDialog } from "@/components/leads/NewLeadDialog";

type LeadRow = Lead & { property?: Property };

const STAGE_LABEL: Record<Lead["stage"], string> = {
  nuevo: "Semilla", contactado: "Brote", visita: "Planta joven",
  aplicacion: "Floración", ganado: "Cosecha", perdido: "Marchita",
};
const STAGE_TONE: Record<Lead["stage"], string> = {
  nuevo: "bg-primary/10 text-primary border-primary/20",
  contactado: "bg-secondary/15 text-secondary border-secondary/20",
  visita: "bg-accent/10 text-accent border-accent/20",
  aplicacion: "bg-accent/20 text-accent border-accent/30",
  ganado: "bg-secondary/25 text-secondary border-secondary/30",
  perdido: "bg-muted text-muted-foreground border-border",
};

function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function daysSince(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

export default function Leads() {
  const [items, setItems] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [stage, setStage] = useState<"todos" | Lead["stage"]>("todos");
  const [conversationTarget, setConversationTarget] = useState<LeadConversationTarget | null>(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  const refreshLeads = () => {
    return api.listLeads().then((l) => setItems(l));
  };

  useEffect(() => {
    refreshLeads().finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => items.filter((l) => {
    if (stage !== "todos" && l.stage !== stage) return false;
    if (q && !`${l.name} ${l.email} ${l.property?.title ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [items, stage, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: items.length };
    items.forEach((l) => { c[l.stage] = (c[l.stage] ?? 0) + 1; });
    return c;
  }, [items]);

  return (
    <AppShell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Semillero</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Leads</h1>
          <p className="text-muted-foreground mt-1">Cada contacto es una semilla por cultivar.</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setNewLeadOpen(true)}>
          <Plus className="h-4 w-4" /> Nuevo lead
        </Button>
      </header>

      <div className="mt-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, correo o propiedad" className="pl-9 h-11" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(["todos", "nuevo", "contactado", "visita", "aplicacion", "ganado", "perdido"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStage(s)}
              className={cn(
                "px-4 h-11 rounded-full text-sm font-medium border transition-colors whitespace-nowrap inline-flex items-center gap-2",
                stage === s ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-foreground border-border hover:bg-surface-muted",
              )}>
              {s === "todos" ? "Todos" : STAGE_LABEL[s]}
              <span className={cn("text-[11px] px-1.5 py-0.5 rounded-full", stage === s ? "bg-primary-foreground/20" : "bg-muted")}>{counts[s] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Sprout className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-display text-xl mt-3">Aún no hay leads en este estado</p>
          <p className="text-muted-foreground text-sm mt-1">Cuando llegue un nuevo interesado, aparecerá aquí.</p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((l) => {
            const days = daysSince(l.createdAt);
            const hot = days <= 2;
            return (
              <li key={l.id}
                className="group rounded-2xl border border-border bg-surface p-5 shadow-soft hover:shadow-card transition-all hover:-translate-y-0.5">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-leaf text-primary-foreground font-display font-semibold shrink-0">
                    {initials(l.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-base font-semibold leading-snug truncate">{l.name}</h3>
                      <span className={cn("text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0", STAGE_TONE[l.stage])}>
                        {STAGE_LABEL[l.stage]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      {hot ? <Flame className="h-3 w-3 text-accent" /> : <Snowflake className="h-3 w-3" />}
                      {days === 0 ? "Hoy" : `Hace ${days} ${days === 1 ? "día" : "días"}`}
                    </p>
                  </div>
                </div>
                <div className="mt-4 space-y-1.5 text-xs text-foreground/80">
                  <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate">{l.email}</span></p>
                  <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{l.phone}</p>
                  {l.property && (
                    <p className="flex items-center gap-2"><HomeIcon className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate">{l.property.title}</span></p>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setConversationTarget({
                        leadId: l.id,
                        contactName: l.name,
                        propertyTitle: l.property?.title,
                      })
                    }
                  >
                    <MessageSquare className="h-3.5 w-3.5" /> Conversación
                  </Button>
                  <Link href="/app/oportunidades" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
                    Ver pipeline <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <LeadConversationDialog
        target={conversationTarget}
        open={!!conversationTarget}
        onOpenChange={(v) => !v && setConversationTarget(null)}
      />

      <NewLeadDialog
        open={newLeadOpen}
        onOpenChange={setNewLeadOpen}
        onCreated={() => void refreshLeads()}
      />
    </AppShell>
  );
}
