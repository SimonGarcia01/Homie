"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Coins, Receipt, Plus, Home as HomeIcon, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/mock/api";
import type { Finance, Property } from "@/lib/mock/db";
import { cn } from "@/lib/utils";

type Row = Finance & { property?: Property };

const fmtCLP = (n: number) => new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

export default function FinancesPage({ kind }: { kind: "ingreso" | "gasto" }) {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.listFinances(kind).then((r) => { setItems(r); setLoading(false); });
  }, [kind]);

  const total = useMemo(() => items.reduce((a, b) => a + b.amount, 0), [items]);
  const thisMonth = useMemo(() => {
    const m = new Date().getMonth();
    return items.filter((r) => new Date(r.date).getMonth() === m).reduce((a, b) => a + b.amount, 0);
  }, [items]);
  const avg = items.length ? total / items.length : 0;

  const byMonth = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((r) => {
      const d = new Date(r.date);
      const key = d.toLocaleDateString("es-CL", { month: "short" });
      m.set(key, (m.get(key) ?? 0) + r.amount);
    });
    return [...m.entries()].reverse().map(([month, amount]) => ({ month, amount }));
  }, [items]);

  const isIngreso = kind === "ingreso";
  const tone = isIngreso ? "primary" : "accent";
  const Icon = isIngreso ? Coins : Receipt;
  const colorVar = isIngreso ? "hsl(var(--primary))" : "hsl(var(--accent))";

  return (
    <AppShell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">{isIngreso ? "Cosecha" : "Cuidado"}</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">{isIngreso ? "Ingresos" : "Gastos"}</h1>
          <p className="text-muted-foreground mt-1">
            {isIngreso ? "Lo que florece y vuelve a la cartera." : "Lo que invertimos para mantener todo creciendo."}
          </p>
        </div>
        <Button variant="hero" size="lg"><Plus className="h-4 w-4" /> Registrar {isIngreso ? "ingreso" : "gasto"}</Button>
      </header>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiTile label="Total acumulado" value={fmtCLP(total)} icon={Icon} tone={tone} />
        <KpiTile label="Este mes" value={fmtCLP(thisMonth)} icon={isIngreso ? TrendingUp : TrendingDown} tone={tone} />
        <KpiTile label="Promedio por movimiento" value={fmtCLP(avg)} icon={Calendar} tone="secondary" />
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-surface p-5 shadow-soft">
        <header className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Tendencia</p>
            <h2 className="font-display text-lg font-semibold">{isIngreso ? "Ingresos" : "Gastos"} por mes</h2>
          </div>
        </header>
        {loading ? (
          <Skeleton className="h-56" />
        ) : (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: number) => fmtCLP(v)} />
                <Bar dataKey="amount" fill={colorVar} radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-surface shadow-soft overflow-hidden">
        <header className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Movimientos</h2>
          <span className="text-xs text-muted-foreground">{items.length} en total</span>
        </header>
        {loading ? (
          <div className="p-6 space-y-3">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((r) => (
              <li key={r.id} className="flex items-center gap-4 px-5 py-4">
                <span className={cn("flex h-10 w-10 items-center justify-center rounded-xl shrink-0", isIngreso ? "bg-primary/10 text-primary" : "bg-accent/15 text-accent")}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-foreground truncate">{r.concept}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 truncate">
                    <span>{new Date(r.date).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" })}</span>
                    {r.property && <span className="inline-flex items-center gap-1"><HomeIcon className="h-3 w-3" />{r.property.title}</span>}
                  </p>
                </div>
                <p className={cn("font-display text-base font-semibold tabular-nums shrink-0", isIngreso ? "text-primary" : "text-accent")}>
                  {isIngreso ? "+" : "−"}{fmtCLP(r.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </AppShell>
  );
}

function KpiTile({ label, value, icon: Icon, tone }: { label: string; value: string; icon: typeof Coins; tone: "primary" | "accent" | "secondary" }) {
  const cls = { primary: "bg-primary/10 text-primary", accent: "bg-accent/15 text-accent", secondary: "bg-secondary/15 text-secondary" }[tone];
  return (
    <div className="rounded-2xl border border-border bg-surface px-5 py-4 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", cls)}><Icon className="h-4 w-4" /></span>
      </div>
      <p className="font-display text-2xl font-semibold tabular-nums mt-2">{value}</p>
    </div>
  );
}
