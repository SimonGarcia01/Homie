"use client";

import { useEffect, useState } from "react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { BarChart3, Download, TrendingUp, TrendingDown, Wallet, Home as HomeIcon, Sprout, Calendar, AlertTriangle } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/mock/api";
import { cn } from "@/lib/utils";

type Dash = Awaited<ReturnType<typeof api.getDashboard>>;

const fmtCLP = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

const STATUS_COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--secondary))", "hsl(var(--muted-foreground))"];

export default function Reports() {
  const [dash, setDash] = useState<Dash | null>(null);

  useEffect(() => { api.getDashboard().then(setDash); }, []);

  const statusData = dash ? [
    { name: "Disponibles", value: dash.byStatus.disponible },
    { name: "Reservadas", value: dash.byStatus.reservada },
    { name: "Arrendadas", value: dash.byStatus.arrendada },
    { name: "Inactivas", value: dash.byStatus.inactiva },
  ] : [];

  return (
    <AppShell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Mirador</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Reportes</h1>
          <p className="text-muted-foreground mt-1">El estado de tu jardín, contado en cifras.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="soft" size="lg"><Calendar className="h-4 w-4" /> Último mes</Button>
          <Button variant="hero" size="lg"><Download className="h-4 w-4" /> Exportar PDF</Button>
        </div>
      </header>

      {/* KPI summary */}
      <section className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Cartera total" value={dash?.total} icon={HomeIcon} tone="primary" />
        <Kpi label="Oportunidades activas" value={dash?.opportunities} icon={Sprout} tone="secondary" />
        <Kpi label="Ingresos del mes" value={dash ? fmtCLP(dash.ingresos) : undefined} icon={TrendingUp} tone="primary" />
        <Kpi label="Balance neto" value={dash ? fmtCLP(dash.balance) : undefined} icon={Wallet} tone={(dash?.balance ?? 0) >= 0 ? "secondary" : "accent"} />
      </section>

      {/* Financial trend */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <header className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BarChart3 className="h-5 w-5" /></span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Tendencia</p>
              <h2 className="font-display text-lg font-semibold">Ingresos vs gastos · últimos 6 meses</h2>
            </div>
          </div>
        </header>
        {!dash ? <Skeleton className="h-64" /> : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dash.trend}>
                <defs>
                  <linearGradient id="rIng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rGas" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmtCLP(v)} />
                <Area type="monotone" dataKey="ingresos" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#rIng)" />
                <Area type="monotone" dataKey="gastos" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#rGas)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      {/* Distribution + Pipeline */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <header className="mb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cartera</p>
            <h2 className="font-display text-lg font-semibold">Distribución por estado</h2>
          </header>
          {!dash ? <Skeleton className="h-64" /> : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {statusData.map((_, i) => <Cell key={i} fill={STATUS_COLORS[i % STATUS_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <header className="mb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pipeline</p>
            <h2 className="font-display text-lg font-semibold">Oportunidades por etapa</h2>
          </header>
          {!dash ? <Skeleton className="h-64" /> : (
            <ul className="space-y-3 pt-2">
              {dash.pipeline.map((s) => {
                const max = Math.max(...dash.pipeline.map((p) => p.count), 1);
                return (
                  <li key={s.key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground"><strong className="font-medium">{s.label}</strong> · <span className="text-muted-foreground">{s.description}</span></span>
                      <span className="font-display tabular-nums">{s.count}</span>
                    </div>
                    <div className="mt-1.5 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-secondary to-primary" style={{ width: `${(s.count / max) * 100}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Top + Expenses */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <header className="mb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mejor rendimiento</p>
            <h2 className="font-display text-lg font-semibold">Top propiedades del mes</h2>
          </header>
          {!dash ? <Skeleton className="h-40" /> : (
            <ul className="space-y-2">
              {dash.topProperties.map((t, i) => (
                <li key={t.property.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary font-display text-xs font-semibold">{i + 1}</span>
                  <span className="text-sm text-foreground truncate flex-1">{t.property.title}</span>
                  <span className="font-display tabular-nums text-sm text-foreground shrink-0">{fmtCLP(t.amount)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <header className="mb-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Categorías</p>
            <h2 className="font-display text-lg font-semibold">Composición de gastos</h2>
          </header>
          {!dash ? <Skeleton className="h-40" /> : (
            <ul className="space-y-3">
              {dash.expenseCategories.map((c) => {
                const total = dash.expenseCategories.reduce((a, b) => a + b.amount, 0);
                const pct = total ? (c.amount / total) * 100 : 0;
                return (
                  <li key={c.label}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{c.label}</span>
                      <span className="font-display tabular-nums">{fmtCLP(c.amount)}</span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-accent rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Alerts */}
      {dash && dash.alerts.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-soft">
          <header className="flex items-center gap-3 mb-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent"><AlertTriangle className="h-5 w-5" /></span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Atención</p>
              <h2 className="font-display text-lg font-semibold">Puntos a revisar</h2>
            </div>
          </header>
          <ul className="space-y-2">
            {dash.alerts.map((a) => (
              <li key={a.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/40 px-3 py-2.5 text-sm">
                <AlertTriangle className={cn("h-4 w-4 mt-0.5", a.level === "warning" ? "text-accent" : "text-primary/70")} />
                <span className="text-foreground">{a.message}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AppShell>
  );
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: React.ReactNode; icon: typeof HomeIcon; tone: "primary" | "secondary" | "accent" }) {
  const cls = { primary: "bg-primary/10 text-primary", secondary: "bg-secondary/15 text-secondary", accent: "bg-accent/15 text-accent" }[tone];
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", cls)}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="font-display text-2xl font-semibold tabular-nums mt-2">
        {value === undefined || value === null ? <Skeleton className="h-7 w-16" /> : value}
      </p>
    </div>
  );
}
