"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardList, Eye, Loader2, XCircle } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { ApplicationDetailSheet } from "@/components/pages/app/ApplicationDetailSheet";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/mock/api";
import type { ApplicationRow } from "@/lib/api/crm";
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

const STATUS_TONE: Record<string, string> = {
  pending_documents: "bg-primary/10 text-primary border-primary/20",
  under_review: "bg-accent/15 text-accent border-accent/20",
  approved: "bg-secondary/15 text-secondary border-secondary/20",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function Applications() {
  const [items, setItems] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const reload = () => api.listApplications().then(setItems).finally(() => setLoading(false));

  useEffect(() => {
    void reload();
  }, []);

  const pending = useMemo(
    () => items.filter((a) => a.status === "pending_documents" || a.status === "under_review").length,
    [items],
  );

  async function setStatus(id: string, status: string, label: string) {
    setBusyId(id);
    try {
      await api.updateApplicationStatus(id, status);
      await reload();
      toast({ title: label });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo actualizar",
        variant: "destructive",
      });
    } finally {
      setBusyId(null);
    }
  }

  function openDetail(id: string) {
    setDetailId(id);
    setDetailOpen(true);
  }

  return (
    <AppShell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Floración</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Aplicaciones</h1>
          <p className="text-muted-foreground mt-1">
            Revisa solicitudes de arriendo en curso.
            {pending > 0 && ` · ${pending} pendientes`}
          </p>
        </div>
      </header>

      <section className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
        {loading ? (
          <p className="p-6 text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <ClipboardList className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-display text-lg mt-3">Sin aplicaciones</p>
            <p className="text-sm text-muted-foreground mt-1">
              Cuando una oportunidad llegue a Floración, aparecerá aquí.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Interesado</TableHead>
                <TableHead>Propiedad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="w-[260px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((app) => {
                const busy = busyId === app.id;
                const tone = STATUS_TONE[app.status] ?? "bg-muted text-muted-foreground border-border";
                return (
                  <TableRow key={app.id}>
                    <TableCell className="font-medium">{app.leadName ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{app.propertyTitle ?? app.propertyId.slice(0, 8)}</TableCell>
                    <TableCell>
                      <span className={cn("text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border", tone)}>
                        {STATUS_LABEL[app.status] ?? app.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(app.createdAt).toLocaleDateString("es-CL")}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap justify-end gap-1">
                        <Button size="sm" variant="soft" onClick={() => openDetail(app.id)}>
                          <Eye className="h-3.5 w-3.5" /> Ver detalle
                        </Button>
                        {app.status === "pending_documents" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={busy}
                            onClick={() => void setStatus(app.id, "under_review", "En revisión")}
                          >
                            Revisar
                          </Button>
                        )}
                        {(app.status === "pending_documents" || app.status === "under_review") && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-secondary"
                              disabled={busy}
                              onClick={() => void setStatus(app.id, "approved", "Aplicación aprobada")}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Aprobar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive"
                              disabled={busy}
                              onClick={() => void setStatus(app.id, "rejected", "Aplicación rechazada")}
                            >
                              <XCircle className="h-3.5 w-3.5" /> Rechazar
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <ApplicationDetailSheet
        applicationId={detailId}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={reload}
      />
    </AppShell>
  );
}
