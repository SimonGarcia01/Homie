"use client";

import { NavLink } from "@/components/NavLink";
import { useRouter } from "next/navigation";
import { ReactNode, useState } from "react";
import {
  Sprout, LayoutDashboard, Home, Users, ShieldCheck, LogOut, Menu, X, Bell,
  Calendar, FileText, Coins, Receipt, BarChart3, UserPlus, Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  coordinador: "Coordinador",
  broker: "Broker",
  agente: "Agente",
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout, hasRole } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const canFinances = !!user && (user.role === "admin" || user.role === "coordinador" || user.role === "broker");
  const canReports = canFinances;

  const nav = [
    { to: "/app", label: "Inicio", icon: LayoutDashboard, end: true },
    { to: "/app/propiedades", label: "Propiedades", icon: Home },
    { to: "/app/leads", label: "Leads", icon: UserPlus },
    { to: "/app/oportunidades", label: "Oportunidades", icon: Leaf },
    { to: "/app/visitas", label: "Visitas", icon: Calendar },
    { to: "/app/documentos", label: "Documentos", icon: FileText },
    ...(canFinances ? [
      { to: "/app/ingresos", label: "Ingresos", icon: Coins },
      { to: "/app/gastos", label: "Gastos", icon: Receipt },
    ] : []),
    ...(canReports ? [{ to: "/app/reportes", label: "Reportes", icon: BarChart3 }] : []),
    ...(hasRole("admin") ? [{ to: "/app/usuarios", label: "Usuarios", icon: Users }] : []),
  ];

  async function handleLogout() {
    await logout();
    router.replace("/login");
  }

  return (
    <div className="min-h-screen bg-background flex">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-72 bg-sidebar border-r border-sidebar-border flex flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-leaf shadow-soft">
              <Sprout className="h-4.5 w-4.5 text-primary-foreground" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">Homie</span>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="lg:hidden text-muted-foreground hover:text-foreground"
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {nav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              href={to}
              end={end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-soft"
                    : "text-sidebar-foreground hover:bg-sidebar-accent",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-2 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-leaf text-primary-foreground font-medium text-sm">
              {user?.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate text-foreground">{user?.name}</p>
              <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                {user ? ROLE_LABEL[user.role] : ""}
              </p>
            </div>
          </div>
          <Button variant="soft" size="sm" className="w-full mt-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </Button>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-30 bg-foreground/30 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between px-4 lg:px-8 h-16">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="lg:hidden text-foreground"
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden lg:block">
              <p className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long" })}
              </p>
            </div>
            <Button variant="ghost" size="icon" aria-label="Notificaciones">
              <Bell className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <main className="flex-1 px-4 lg:px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
