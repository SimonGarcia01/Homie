"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { FileText, Upload, Download, AlertTriangle, CheckCircle2, Clock, XCircle, Home as HomeIcon, User as UserIcon, Loader2, Sparkles } from "lucide-react";
import { SearchInputWithSpeech } from "@/components/speech/SearchInputWithSpeech";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/mock/api";
import type { Document, Lead, Owner, Property } from "@/lib/mock/db";
import { classifyDocument, isAiError, type DocumentKind as AiDocKind } from "@/lib/api/ai";
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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [uploadPropertyId, setUploadPropertyId] = useState("");
  const [uploadLeadId, setUploadLeadId] = useState("");
  const [uploadKind, setUploadKind] = useState<Document["kind"]>("otro");
  const [uploading, setUploading] = useState(false);
  const [busyDocId, setBusyDocId] = useState<string | null>(null);
  const [classifySuggested, setClassifySuggested] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = () => api.listDocuments().then((d) => { setItems(d); setLoading(false); });

  useEffect(() => {
    reload();
  }, []);

  useEffect(() => {
    if (!uploadOpen) return;
    Promise.all([api.listProperties(), api.listLeads()]).then(([props, leadRows]) => {
      setProperties(props);
      setLeads(leadRows);
    });
  }, [uploadOpen]);

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

  function openUploadPicker() {
    fileRef.current?.click();
  }

  async function onFilePicked(file: File | undefined) {
    if (!file) return;
    setUploadFile(file);
    setUploadPropertyId("");
    setUploadLeadId("");
    setUploadKind("otro");
    setClassifySuggested(false);
    setUploadOpen(true);
    // Auto-classify asynchronously
    try {
      const result = await classifyDocument(file.name, file.type || undefined);
      if (!isAiError(result) && result.kind !== "otro") {
        setUploadKind(result.kind as Document["kind"]);
        setClassifySuggested(result.confidence === "low");
      }
    } catch {
      // silently skip
    }
  }

  async function handleUploadSubmit(e: FormEvent) {
    e.preventDefault();
    if (!uploadFile) return;
    setUploading(true);
    try {
      await api.uploadDocument(uploadFile, {
        propertyId: uploadPropertyId || undefined,
        leadId: uploadLeadId || undefined,
        kind: uploadKind,
      });
      await reload();
      toast({ title: "Documento subido" });
      setUploadOpen(false);
      setUploadFile(null);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Upload failed",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleDocStatus(id: string, next: "approved" | "rejected") {
    setBusyDocId(id);
    try {
      await api.updateDocumentStatus(id, next);
      await reload();
      toast({ title: next === "approved" ? "Documento verificado" : "Documento rechazado" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo actualizar",
        variant: "destructive",
      });
    } finally {
      setBusyDocId(null);
    }
  }

  return (
    <AppShell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Raíces</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Documentos</h1>
          <p className="text-muted-foreground mt-1">El respaldo silencioso que sostiene cada operación.</p>
        </div>
        <Button variant="hero" size="lg" onClick={openUploadPicker}>
          <Upload className="h-4 w-4" /> Subir documento
        </Button>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            onFilePicked(e.target.files?.[0]);
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
        <SearchInputWithSpeech
          className="flex-1"
          inputClassName="h-11"
          value={q}
          onChange={setQ}
          placeholder="Buscar por nombre, propiedad o lead"
        />
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
              const busy = busyDocId === d.id;
              return (
                <li key={d.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 hover:bg-surface-muted/40 transition-colors">
                  <div className="flex items-center gap-4 min-w-0 flex-1">
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
                  </div>
                  <div className="flex items-center gap-2 shrink-0 pl-15 sm:pl-0">
                    <span className={cn("text-[10px] uppercase tracking-wide px-2 py-1 rounded-full border inline-flex items-center gap-1", meta.tone)}>
                      <Icon className="h-3 w-3" /> {meta.label}
                    </span>
                    {d.status === "pendiente" && (
                      <>
                        <Button size="sm" variant="soft" disabled={busy} onClick={() => void handleDocStatus(d.id, "approved")}>
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Verificar"}
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" disabled={busy} onClick={() => void handleDocStatus(d.id, "rejected")}>
                          Rechazar
                        </Button>
                      </>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => api.downloadDocument(d.id)}>
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">Subir documento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUploadSubmit} className="space-y-4 mt-2">
            {uploadFile && (
              <p className="text-sm text-muted-foreground truncate">
                Archivo: <strong className="text-foreground">{uploadFile.name}</strong>
              </p>
            )}
            <div className="space-y-2">
              <Label>Propiedad (opcional)</Label>
              <Select value={uploadPropertyId || "__none__"} onValueChange={(v) => setUploadPropertyId(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Sin propiedad" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin propiedad</SelectItem>
                  {properties.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Lead (opcional)</Label>
              <Select value={uploadLeadId || "__none__"} onValueChange={(v) => setUploadLeadId(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Sin lead" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Sin lead</SelectItem>
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <Label>Tipo</Label>
                {classifySuggested && (
                  <span className="text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                    <Sparkles className="h-2.5 w-2.5" /> sugerido
                  </span>
                )}
              </div>
              <Select value={uploadKind} onValueChange={(v) => { setUploadKind(v as Document["kind"]); setClassifySuggested(false); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(KIND_LABEL) as Document["kind"][]).map((k) => (
                    <SelectItem key={k} value={k}>{KIND_LABEL[k]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setUploadOpen(false)} disabled={uploading}>
                Cancelar
              </Button>
              <Button type="submit" variant="hero" disabled={uploading || !uploadFile}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Subir"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
