"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { FileText, Search, Upload, Download, AlertTriangle, CheckCircle2, Clock, XCircle, Home as HomeIcon, User as UserIcon } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/mock/api";
import type { Document, Lead, Owner, Property } from "@/lib/mock/db";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type DocRow = Document & { property?: Property; lead?: Lead; owner?: Owner };

const KIND_LABEL: Record<Document["kind"], string> = {
  contrato: "Contrato", cedula: "Cédula", comprobante: "Comprobante", garantia: "Garantía", otro: "Otro",
};
const STATUS_META: Record<Document["status"], { label: string; tone: string; icon: typeof CheckCircle2 }> = {
  verificado: { label: "Verificado", tone: "bg-secondary/15 text-secondary border-secondary/25", icon: CheckCircle2 },
  pendiente: { label: "Pendiente", tone: "bg-primary/10 text-primary border-primary/20", icon: Clock },
  rechazado: { label: "Rechazado", tone: "bg-destructive/10 text-destructive border-destructive/20", icon: XCircle },
  vencido: { label: "Vencido", tone: "bg-accent/15 text-accent border-accent/25", icon: AlertTriangle },
};

export default function Documents() {
  const [items, setItems] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"todos" | Document["status"]>("todos");
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = () => api.listDocuments().then((d) => { setItems(d); setLoading(false); });

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => items.filter((d) => {
    if (status !== "todos" && d.status !== status) return false;
    if (q && !`${d.name} ${d.property?.title ?? ""} ${d.lead?.name ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [items, status, q]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { todos: items.length };
    items.forEach((d) => { c[d.status] = (c[d.status] ?? 0) + 1; });
    return c;
  }, [items]);

  return (
    <AppShell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Raíces</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground mt-1">El respaldo silencioso que sostiene cada operación.</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => fileRef.current?.click()}>
          <Upload className="h-4 w-4" /> Subir documento
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              await api.uploadDocument(file);
              await reload();
              toast({ title: "Documento subido" });
            } catch (err) {
              toast({ title: "Error", description: err instanceof Error ? err.message : "Upload failed", variant: "destructive" });
            }
            e.target.value = "";
          }}
        />
      </header>

      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {(["verificado", "pendiente", "rechazado", "vencido"] as const).map((s) => {
          const meta = STATUS_META[s]; const Icon = meta.icon;
          return (
            <div key={s} className="rounded-2xl border border-border bg-surface px-4 py-3 shadow-soft">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{meta.label}</p>
                <span className={cn("flex h-7 w-7 items-center justify-center rounded-lg border", meta.tone)}><Icon className="h-3.5 w-3.5" /></span>
              </div>
              <p className="font-display text-2xl font-semibold tabular-nums mt-1">{counts[s] ?? 0}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, propiedad o lead" className="pl-9 h-11" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(["todos", "pendiente", "verificado", "rechazado", "vencido"] as const).map((s) => (
            <button key={s} type="button" onClick={() => setStatus(s)}
              className={cn(
                "px-4 h-11 rounded-full text-sm font-medium border transition-colors whitespace-nowrap",
                status === s ? "bg-primary text-primary-foreground border-primary" : "bg-surface text-foreground border-border hover:bg-surface-muted",
              )}>
              {s === "todos" ? "Todos" : STATUS_META[s].label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-display text-xl mt-3">No hay documentos por mostrar</p>
            <p className="text-muted-foreground text-sm mt-1">Sube uno para empezar a construir el respaldo.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((d) => {
              const meta = STATUS_META[d.status]; const Icon = meta.icon;
              const uploaded = new Date(d.uploadedAt).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
              return (
                <li key={d.id} className="flex items-center gap-4 px-5 py-4 hover:bg-surface-muted/40 transition-colors">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0"><FileText className="h-5 w-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{d.name}</p>
                      <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-muted text-muted-foreground shrink-0">{KIND_LABEL[d.kind]}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {d.property && <span className="inline-flex items-center gap-1"><HomeIcon className="h-3 w-3" />{d.property.title}</span>}
                      {d.lead && <span className="inline-flex items-center gap-1"><UserIcon className="h-3 w-3" />{d.lead.name}</span>}
                      <span>Subido el {uploaded}</span>
                      <span>· {d.size}</span>
                    </div>
                  </div>
                  <span className={cn("text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border inline-flex items-center gap-1 shrink-0", meta.tone)}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </span>
                  <Button variant="ghost" size="sm" className="shrink-0" onClick={() => api.downloadDocument(d.id)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
