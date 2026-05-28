"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Building2, Loader2, Pencil, Plus, Trash2, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { api } from "@/lib/mock/api";
import type { Owner, Property } from "@/lib/mock/db";
import { toast } from "@/hooks/use-toast";

type OwnerForm = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  ownerType: "person" | "company";
};

const emptyForm = (): OwnerForm => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  ownerType: "person",
});

export default function Owners() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Owner | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<OwnerForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  const propertyCountByOwner = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of properties) {
      map.set(p.ownerId, (map.get(p.ownerId) ?? 0) + 1);
    }
    return map;
  }, [properties]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ownerRows, propertyRows] = await Promise.all([api.listOwners(), api.listProperties()]);
      setOwners(ownerRows);
      setProperties(propertyRows);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  }

  function openEdit(owner: Owner) {
    const [firstName, ...rest] = owner.name.split(" ");
    setEditingId(owner.id);
    setForm({
      firstName: firstName ?? "",
      lastName: rest.join(" ") || firstName || "",
      email: owner.email,
      phone: owner.phone,
      ownerType: "person",
    });
    setDialogOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast({ title: "Nombre y apellido son obligatorios", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await api.updateOwner(editingId, form);
        toast({ title: "Propietario actualizado" });
      } else {
        await api.createOwner(form);
        toast({ title: "Propietario creado" });
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo guardar",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await api.deleteOwner(deleteTarget.id);
      toast({ title: "Propietario eliminado" });
      setDeleteTarget(null);
      await load();
    } catch (err) {
      toast({
        title: "No se pudo eliminar",
        description: err instanceof Error ? err.message : "Intenta de nuevo",
        variant: "destructive",
      });
    }
  }

  return (
    <AppShell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Raíces</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Propietarios</h1>
          <p className="text-muted-foreground mt-1">Gestiona a quienes confían sus propiedades a tu cartera.</p>
        </div>
        <Button variant="hero" size="lg" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Nuevo propietario
        </Button>
      </header>

      <section className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
        {loading ? (
          <p className="p-6 text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </p>
        ) : owners.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-display text-lg mt-3">Sin propietarios aún</p>
            <p className="text-sm text-muted-foreground mt-1">Crea el primero para asociarlo a tus propiedades.</p>
            <Button variant="soft" className="mt-4" onClick={openCreate}>
              <UserPlus className="h-4 w-4" /> Crear propietario
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="text-right">Propiedades</TableHead>
                <TableHead className="w-[100px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {owners.map((owner) => (
                <TableRow key={owner.id}>
                  <TableCell className="font-medium">{owner.name}</TableCell>
                  <TableCell className="text-muted-foreground">{owner.email || "—"}</TableCell>
                  <TableCell className="text-muted-foreground">{owner.phone || "—"}</TableCell>
                  <TableCell className="text-right tabular-nums">{propertyCountByOwner.get(owner.id) ?? 0}</TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" aria-label="Editar" onClick={() => openEdit(owner)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Eliminar"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeleteTarget(owner)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editingId ? "Editar propietario" : "Nuevo propietario"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="owner-first">Nombre</Label>
                <Input
                  id="owner-first"
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner-last">Apellido</Label>
                <Input
                  id="owner-last"
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-email">Correo</Label>
              <Input
                id="owner-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner-phone">Teléfono</Label>
              <Input
                id="owner-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select
                value={form.ownerType}
                onValueChange={(v) => setForm((f) => ({ ...f, ownerType: v as OwnerForm["ownerType"] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="person">Persona</SelectItem>
                  <SelectItem value="company">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" variant="hero" disabled={saving}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingId ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar propietario?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará a {deleteTarget?.name}. Las propiedades asociadas conservarán su referencia hasta que las reasignes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleDelete()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
