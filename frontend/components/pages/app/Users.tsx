"use client";

import { useEffect, useState } from "react";
import { ShieldCheck, UserPlus } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
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

  useEffect(() => {
    api.listUsers().then((u) => { setItems(u); setLoading(false); });
  }, []);

  async function toggle(id: string) {
    await api.toggleUserActive(id);
    const fresh = await api.listUsers();
    setItems(fresh);
    toast({ title: "Usuario actualizado" });
  }

  return (
    <AppShell>
      <header className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Quiénes cuidan el jardín</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-muted-foreground mt-1">Gestiona accesos y roles del equipo.</p>
        </div>
        <Button variant="hero" size="lg" onClick={() => toast({ title: "Pronto", description: "El alta de usuarios estará disponible al conectar Lovable Cloud." })}>
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
    </AppShell>
  );
}
