"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Download,
  FileUp,
  Loader2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/mock/api";
import type { ApplicationDetail } from "@/lib/api/crm";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const STATUS_LABEL: Record<string, string> = {
  started: "Iniciada",
  pending_documents: "Docs pendientes",
  under_review: "En revisión",
  approved: "Aprobada",
  rejected: "Rechazada",
  withdrawn: "Retirada",
};

const CHECKLIST_STATUS_LABEL: Record<string, string> = {
  pending: "Pendiente",
  received: "Recibido",
  approved: "Aprobado",
  rejected: "Rechazado",
  expired: "Vencido",
};

const CHECKLIST_TONE: Record<string, string> = {
  pending: "bg-muted text-muted-foreground border-border",
  received: "bg-accent/15 text-accent border-accent/20",
  approved: "bg-secondary/15 text-secondary border-secondary/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  expired: "bg-warning/15 text-warning border-warning/20",
};

const EVALUATION_LABEL: Record<string, string> = {
  approved: "Aprobado",
  approved_with_conditions: "Aprobado con condiciones",
  rejected: "Rechazado",
};

type Props = {
  applicationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: () => void;
};

export function ApplicationDetailSheet({ applicationId, open, onOpenChange, onUpdated }: Props) {
  const [detail, setDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [busyItemId, setBusyItemId] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const [evaluationRecommendation, setEvaluationRecommendation] = useState("approved");
  const [evaluationNotes, setEvaluationNotes] = useState("");

  const [contractStart, setContractStart] = useState("");
  const [contractEnd, setContractEnd] = useState("");
  const [contractRent, setContractRent] = useState("");

  const reload = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    try {
      const data = await api.getApplication(applicationId);
      setDetail(data);
      if (data.contract) {
        setContractStart(data.contract.startDate);
        setContractEnd(data.contract.endDate);
        setContractRent(data.contract.monthlyRent);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo cargar la aplicación",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    if (open && applicationId) {
      void reload();
    } else if (!open) {
      setDetail(null);
      setEvaluationNotes("");
    }
  }, [open, applicationId, reload]);

  async function handleUpload(itemId: string, file: File, documentTypeKey: string) {
    if (!detail) return;
    setBusyItemId(itemId);
    try {
      await api.uploadApplicationDocument(detail.id, itemId, file, {
        propertyId: detail.propertyId,
        kind: documentTypeKey,
      });
      await reload();
      onUpdated?.();
      toast({ title: "Documento subido" });
    } catch (err) {
      toast({
        title: "Error al subir",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleChecklistStatus(itemId: string, status: string) {
    if (!detail) return;
    setBusyItemId(itemId);
    try {
      const updated = await api.updateChecklistItem(detail.id, itemId, status);
      setDetail(updated);
      onUpdated?.();
      toast({ title: status === "approved" ? "Documento aprobado" : "Documento rechazado" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo actualizar",
        variant: "destructive",
      });
    } finally {
      setBusyItemId(null);
    }
  }

  async function handleCreateEvaluation() {
    if (!detail) return;
    setBusyAction("evaluation");
    try {
      const updated = await api.createEvaluation(detail.id, {
        recommendation: evaluationRecommendation,
        notes: evaluationNotes.trim() || undefined,
      });
      setDetail(updated);
      onUpdated?.();
      toast({ title: "Evaluación guardada" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo guardar",
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleCreateContract() {
    if (!detail || !contractStart || !contractEnd || !contractRent) return;
    setBusyAction("contract");
    try {
      const updated = await api.createContract(detail.id, {
        startDate: contractStart,
        endDate: contractEnd,
        monthlyRent: contractRent,
      });
      setDetail(updated);
      onUpdated?.();
      toast({ title: "Contrato creado" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo crear el contrato",
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleSignContract() {
    if (!detail) return;
    setBusyAction("sign");
    try {
      const updated = await api.updateContract(detail.id, { status: "signed" });
      setDetail(updated);
      onUpdated?.();
      toast({ title: "Contrato marcado como firmado" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo firmar",
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  }

  async function handleDownload(documentId: string) {
    try {
      await api.downloadDocument(documentId);
    } catch {
      toast({ title: "Error al descargar", variant: "destructive" });
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display text-xl pr-8">
            {detail?.lead?.name ?? detail?.leadName ?? "Aplicación"}
          </SheetTitle>
          {detail && (
            <p className="text-sm text-muted-foreground">
              {detail.property?.title ?? detail.propertyTitle} ·{" "}
              {STATUS_LABEL[detail.status] ?? detail.status}
            </p>
          )}
        </SheetHeader>

        {loading ? (
          <p className="mt-8 text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        ) : !detail ? (
          <p className="mt-8 text-muted-foreground">Selecciona una aplicación.</p>
        ) : (
          <Tabs defaultValue="checklist" className="mt-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="checklist">Checklist</TabsTrigger>
              <TabsTrigger value="evaluation">Evaluación</TabsTrigger>
              <TabsTrigger value="contract">Contrato</TabsTrigger>
            </TabsList>

            <TabsContent value="checklist" className="mt-4 space-y-3">
              {detail.checklistItems.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin documentos requeridos.</p>
              ) : (
                detail.checklistItems.map((item) => {
                  const busy = busyItemId === item.id;
                  const tone = CHECKLIST_TONE[item.status] ?? CHECKLIST_TONE.pending;
                  return (
                    <div key={item.id} className="rounded-xl border border-border bg-surface p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-sm">{item.documentType.label}</p>
                          {item.document && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">
                              {item.document.name}
                            </p>
                          )}
                        </div>
                        <span className={cn("text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border shrink-0", tone)}>
                          {CHECKLIST_STATUS_LABEL[item.status] ?? item.status}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <input
                          ref={(el) => { fileRefs.current[item.id] = el; }}
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) void handleUpload(item.id, file, item.documentType.key);
                            e.target.value = "";
                          }}
                        />
                        <Button
                          size="sm"
                          variant="soft"
                          disabled={busy}
                          onClick={() => fileRefs.current[item.id]?.click()}
                        >
                          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
                          Subir
                        </Button>
                        {item.document && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => void handleDownload(item.document!.id)}
                          >
                            <Download className="h-3.5 w-3.5" /> Descargar
                          </Button>
                        )}
                        {(item.status === "received" || item.status === "pending") && item.document && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-secondary"
                              disabled={busy}
                              onClick={() => void handleChecklistStatus(item.id, "approved")}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              disabled={busy}
                              onClick={() => void handleChecklistStatus(item.id, "rejected")}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </TabsContent>

            <TabsContent value="evaluation" className="mt-4 space-y-4">
              {detail.evaluation ? (
                <div className="rounded-xl border border-border bg-surface p-4 space-y-2">
                  <p className="text-sm font-medium">
                    {EVALUATION_LABEL[detail.evaluation.recommendation] ?? detail.evaluation.recommendation}
                  </p>
                  {detail.evaluation.notes && (
                    <p className="text-sm text-muted-foreground">{detail.evaluation.notes}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(detail.evaluation.createdAt).toLocaleString("es-CL")}
                  </p>
                </div>
              ) : detail.status === "under_review" || detail.status === "pending_documents" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Recomendación</Label>
                    <Select value={evaluationRecommendation} onValueChange={setEvaluationRecommendation}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="approved">Aprobado</SelectItem>
                        <SelectItem value="approved_with_conditions">Aprobado con condiciones</SelectItem>
                        <SelectItem value="rejected">Rechazado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notas</Label>
                    <Textarea
                      rows={3}
                      value={evaluationNotes}
                      onChange={(e) => setEvaluationNotes(e.target.value)}
                      placeholder="Observaciones sobre el arrendatario…"
                    />
                  </div>
                  <Button
                    variant="hero"
                    disabled={busyAction === "evaluation"}
                    onClick={() => void handleCreateEvaluation()}
                  >
                    {busyAction === "evaluation" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Guardar evaluación
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  La evaluación estará disponible cuando la aplicación esté en revisión.
                </p>
              )}
            </TabsContent>

            <TabsContent value="contract" className="mt-4 space-y-4">
              {detail.contract?.status === "signed" ? (
                <div className="rounded-xl border border-secondary/30 bg-secondary/10 p-4 space-y-2">
                  <p className="text-sm font-medium text-secondary">Contrato firmado</p>
                  <p className="text-sm text-muted-foreground">
                    {detail.contract.startDate} → {detail.contract.endDate}
                  </p>
                  <p className="text-sm font-semibold">${Number(detail.contract.monthlyRent).toLocaleString("es-CL")} / mes</p>
                  {detail.contract.signedAt && (
                    <p className="text-xs text-muted-foreground">
                      Firmado el {new Date(detail.contract.signedAt).toLocaleDateString("es-CL")}
                    </p>
                  )}
                </div>
              ) : detail.contract ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-surface p-4 space-y-1">
                    <p className="text-sm font-medium">Borrador de contrato</p>
                    <p className="text-sm text-muted-foreground">
                      {detail.contract.startDate} → {detail.contract.endDate}
                    </p>
                    <p className="text-sm font-semibold">${Number(detail.contract.monthlyRent).toLocaleString("es-CL")} / mes</p>
                  </div>
                  <Button
                    variant="hero"
                    disabled={busyAction === "sign"}
                    onClick={() => void handleSignContract()}
                  >
                    {busyAction === "sign" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Marcar como firmado
                  </Button>
                </div>
              ) : detail.status === "approved" ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="startDate">Inicio</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={contractStart}
                        onChange={(e) => setContractStart(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">Término</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={contractEnd}
                        onChange={(e) => setContractEnd(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="monthlyRent">Arriendo mensual</Label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      value={contractRent}
                      onChange={(e) => setContractRent(e.target.value)}
                      placeholder="650000"
                    />
                  </div>
                  <Button
                    variant="hero"
                    disabled={busyAction === "contract" || !contractStart || !contractEnd || !contractRent}
                    onClick={() => void handleCreateContract()}
                  >
                    {busyAction === "contract" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Crear contrato
                  </Button>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  El contrato estará disponible cuando la aplicación sea aprobada.
                </p>
              )}
            </TabsContent>
          </Tabs>
        )}
      </SheetContent>
    </Sheet>
  );
}
