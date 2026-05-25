"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/mock/api";
import type { Role, User } from "@/lib/mock/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

const ROLE_LABEL: Record<Role, string> = {
  admin: "Administrador",
  coordinador: "Coordinador",
  broker: "Broker",
  agente: "Agente",
};

type SafeUser = Omit<User, "password">;

export default function Users() {
  const [items, setItems] = useState<SafeUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "agente" as Role, password: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.listUsers().then((u) => { setItems(u); setLoading(false); });
  }, []);

  async function toggle(id: string) {
    await api.toggleUserActive(id);
    setItems(await api.listUsers());
    toast({ title: "Usuario actualizado" });
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createUser(form);
      setItems(await api.listUsers());
      setOpen(false);
      setForm({ name: "", email: "", role: "agente", password: "" });
      toast({ title: "Usuario creado" });
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "No se pudo crear", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Quiénes cuidan el jardín</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground mt-1">Gestiona accesos y roles del equipo.</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => setOpen(true)}>
          <UserPlus className="h-4 w-4" /> Nuevo usuario
        </Button>
      </header>

      <section className="mt-8 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
        {loading ? (
          <p className="p-6 text-muted-foreground">Cargando…</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Persona</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-leaf text-primary-foreground text-xs font-medium">
                        {u.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      <span className="font-medium text-foreground">{u.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{u.email}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                      <ShieldCheck className="h-3 w-3" /> {ROLE_LABEL[u.role]}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className={cn(
                      "text-xs font-medium px-2 py-1 rounded-full border",
                      u.active ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-border",
                    )}>
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="soft" size="sm" onClick={() => toggle(u.id)}>
                      {u.active ? "Desactivar" : "Activar"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label>Rol</Label>
              <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v as Role })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="coordinador">Coordinador</SelectItem>
                  <SelectItem value="agente">Agente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            <Button type="submit" variant="hero" className="w-full" disabled={saving}>
              {saving ? "Creando…" : "Crear usuario"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
