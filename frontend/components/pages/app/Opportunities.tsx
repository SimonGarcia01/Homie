"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useState } from "react";
import { Sprout, Leaf, TreeDeciduous, Flower2, CheckCircle2, XCircle, Mail, Phone, ArrowRight, MessageSquare, GripVertical } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/mock/api";
import type { Lead, Property } from "@/lib/mock/db";
import { cn } from "@/lib/utils";
import { LeadConversationDialog } from "@/components/conversations/LeadConversationDialog";
import type { LeadConversationTarget } from "@/components/conversations/LeadConversationPanel";
import { toast } from "@/hooks/use-toast";

type LeadRow = Lead & { property?: Property; leadId?: string };

const STAGES: { key: Lead["stage"]; label: string; description: string; icon: typeof Sprout; tone: string }[] = [
  { key: "nuevo", label: "Semilla", description: "Recién llegados", icon: Sprout, tone: "primary" },
  { key: "contactado", label: "Brote", description: "Conversación iniciada", icon: Leaf, tone: "secondary" },
  { key: "visita", label: "Planta joven", description: "Visita agendada", icon: TreeDeciduous, tone: "accent" },
  { key: "aplicacion", label: "Floración", description: "Aplicación en curso", icon: Flower2, tone: "accent" },
  { key: "ganado", label: "Cosecha", description: "Convertido", icon: CheckCircle2, tone: "secondary" },
];

function initials(n: string) { return n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase(); }

function OpportunityCard({
  item,
  dragging = false,
  onConversation,
}: {
  item: LeadRow;
  dragging?: boolean;
  onConversation: (item: LeadRow) => void;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border/60 bg-background/60 p-3 transition-colors",
        dragging ? "shadow-leaf ring-2 ring-primary/30" : "hover:border-primary/30",
      )}
    >
      <div className="flex items-center gap-2.5">
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0 cursor-grab active:cursor-grabbing" />
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-leaf text-primary-foreground text-[11px] font-semibold shrink-0">{initials(item.name)}</div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate text-foreground">{item.name}</p>
          <p className="text-[11px] text-muted-foreground truncate">{item.property?.title ?? "Sin propiedad"}</p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground pl-5">
        <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{item.email.split("@")[0]}</span>
        <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{item.phone.slice(-7)}</span>
      </div>
      {item.leadId && (
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 h-7 px-2 text-[11px] ml-5"
          onClick={() => onConversation(item)}
        >
          <MessageSquare className="h-3 w-3" /> Conversación
        </Button>
      )}
    </div>
  );
}

function DraggableCard({ item, onConversation }: { item: LeadRow; onConversation: (item: LeadRow) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: item.id });
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined;

  return (
    <li ref={setNodeRef} style={style} className={cn(isDragging && "opacity-40")} {...listeners} {...attributes}>
      <OpportunityCard item={item} onConversation={onConversation} />
    </li>
  );
}

function StageColumn({
  stage,
  items,
  onConversation,
}: {
  stage: (typeof STAGES)[number];
  items: LeadRow[];
  onConversation: (item: LeadRow) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const Icon = stage.icon;
  const iconTone = { primary: "bg-primary/10 text-primary", secondary: "bg-secondary/15 text-secondary", accent: "bg-accent/15 text-accent" }[stage.tone] ?? "bg-muted";

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "rounded-2xl border bg-surface/80 backdrop-blur p-4 shadow-soft min-h-[280px] transition-colors",
        isOver ? "border-primary/50 bg-primary/5" : "border-border",
      )}
    >
      <header className="flex items-start gap-3 mb-4">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", iconTone)}><Icon className="h-4 w-4" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-sm font-semibold">{stage.label}</h3>
            <span className="text-xs font-display tabular-nums text-foreground/70">{items.length}</span>
          </div>
          <p className="text-[11px] text-muted-foreground">{stage.description}</p>
        </div>
      </header>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic px-1">Sin oportunidades aquí.</p>
      ) : (
        <ul className="space-y-2.5">
          {items.map((l) => (
            <DraggableCard key={l.id} item={l} onConversation={onConversation} />
          ))}
        </ul>
      )}
    </section>
  );
}

export default function Opportunities() {
  const [items, setItems] = useState<LeadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationTarget, setConversationTarget] = useState<LeadConversationTarget | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  useEffect(() => {
    api
      .listOpportunities()
      .then((l) => setItems(l))
      .catch((err) => {
        toast({
          title: "No se pudo cargar el pipeline",
          description: err instanceof Error ? err.message : "Intenta de nuevo.",
          variant: "destructive",
        });
        setItems([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const byStage = useMemo(() => {
    const map: Record<string, LeadRow[]> = {};
    STAGES.forEach((s) => { map[s.key] = []; });
    map.perdido = [];
    items.forEach((l) => { (map[l.stage] ??= []).push(l); });
    return map;
  }, [items]);

  const activeItem = useMemo(() => items.find((i) => i.id === activeId) ?? null, [items, activeId]);

  const total = items.filter((l) => l.stage !== "perdido" && l.stage !== "ganado").length;
  const ganados = byStage.ganado?.length ?? 0;
  const perdidos = byStage.perdido?.length ?? 0;
  const conversion = total + ganados > 0 ? Math.round((ganados / (total + ganados + perdidos)) * 100) : 0;

  function handleConversation(item: LeadRow) {
    if (!item.leadId) return;
    setConversationTarget({
      leadId: item.leadId,
      contactName: item.name,
      propertyTitle: item.property?.title,
      opportunityId: item.id,
    });
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id));
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const opportunityId = String(active.id);
    const newStage = String(over.id) as Lead["stage"];
    const item = items.find((i) => i.id === opportunityId);
    if (!item || item.stage === newStage) return;
    if (!STAGES.some((s) => s.key === newStage) && newStage !== "perdido") return;

    const prev = items;
    setItems((current) =>
      current.map((i) => (i.id === opportunityId ? { ...i, stage: newStage } : i)),
    );

    try {
      await api.updateOpportunityStage(opportunityId, newStage);
      if (newStage === "aplicacion" && item.propertyId) {
        try {
          await api.createApplication(opportunityId, item.propertyId);
        } catch {
          // Application may already exist
        }
      }
    } catch (err) {
      setItems(prev);
      toast({
        title: "No se pudo mover",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <AppShell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Crecimiento</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Oportunidades</h1>
          <p className="text-muted-foreground mt-1">Arrastra las tarjetas entre etapas para actualizar el pipeline.</p>
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
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={(e) => void handleDragEnd(e)}>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
            {STAGES.map((s) => (
              <StageColumn
                key={s.key}
                stage={s}
                items={byStage[s.key] ?? []}
                onConversation={handleConversation}
              />
            ))}
          </div>
          <DragOverlay>
            {activeItem ? (
              <OpportunityCard item={activeItem} dragging onConversation={handleConversation} />
            ) : null}
          </DragOverlay>
        </DndContext>
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

      <LeadConversationDialog
        target={conversationTarget}
        open={!!conversationTarget}
        onOpenChange={(v) => !v && setConversationTarget(null)}
      />
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
