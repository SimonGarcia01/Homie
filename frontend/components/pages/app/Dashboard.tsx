"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Home, Sprout, Calendar, FileText, Wallet, AlertTriangle, ArrowUpRight,
  Plus, UserPlus, CalendarPlus, Upload, BarChart3, Leaf, TrendingUp, TrendingDown,
  Flower2, TreeDeciduous, CheckCircle2, ArrowRight, Coins, Receipt, X, Clock, Sparkles, RotateCcw,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
} from "recharts";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { api, can } from "@/lib/mock/api";
import { getWeeklyDigest, isAiError, type WeeklyDigest } from "@/lib/api/ai";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { LeafRain } from "@/components/garden/LeafRain";
import { PortalTransition, type PortalOrigin } from "@/components/garden/PortalTransition";

type Dash = Awaited<ReturnType<typeof api.getDashboard>>;
type Activity = Awaited<ReturnType<typeof api.getRecentActivity>>;
type Visits = Awaited<ReturnType<typeof api.getUpcomingVisits>>;

const fmtCLP = (n: number) =>
  new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(n);

function formatActivityDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "Hace un momento";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Hace ${diffD} d`;
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(date);
}

const ACTIVITY_ICON = {
  propiedad: Home, lead: Sprout, visita: Calendar, documento: FileText, contrato: FileText, oportunidad: Leaf,
} as const;

export default function Dashboard() {
  const { user } = useAuth();
  const [dash, setDash] = useState<Dash | null>(null);
  const [activity, setActivity] = useState<Activity>([]);
  const [upcoming, setUpcoming] = useState<Visits>([]);
  const [error, setError] = useState<string | null>(null);
  const [loadingDash, setLoadingDash] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingVisits, setLoadingVisits] = useState(true);
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [digest, setDigest] = useState<WeeklyDigest | null>(null);
  const [digestLoading, setDigestLoading] = useState(true);

  useEffect(() => {
    const todayKey = new Date().toISOString().slice(0, 10);
    setReminderDismissed(sessionStorage.getItem(`visit-reminder-dismissed-${todayKey}`) === "1");
  }, []);

  useEffect(() => {
    void api.getDashboard()
      .then(setDash)
      .catch(() => setError("No pudimos cargar tu jardín. Intenta nuevamente en unos segundos."))
      .finally(() => setLoadingDash(false));

    void api.getRecentActivity()
      .then(setActivity)
      .catch(() => setActivity([]))
      .finally(() => setLoadingActivity(false));

    void api.getUpcomingVisits()
      .then(setUpcoming)
      .catch(() => setUpcoming([]))
      .finally(() => setLoadingVisits(false));

    void getWeeklyDigest()
      .then((r) => { if (!isAiError(r)) setDigest(r); })
      .catch(() => {})
      .finally(() => setDigestLoading(false));
  }, []);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Buenos días";
    if (h < 19) return "Buenas tardes";
    return "Buenas noches";
  })();

  const heroMessage = loadingDash
    ? "Preparando tu jardín…"
    : dash
    ? dash.alerts.length === 0
      ? "Tu cartera está floreciendo. No hay pendientes críticos."
      : `Tu cartera está en orden. Hay ${dash.alerts.length} jardineras que piden atención.`
    : "Preparando tu jardín…";

  const visitsToday = upcoming.filter((v) => {
    const d = new Date(v.date);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate() &&
      v.status === "programada"
    );
  });

  function dismissReminder() {
    const todayKey = new Date().toISOString().slice(0, 10);
    sessionStorage.setItem(`visit-reminder-dismissed-${todayKey}`, "1");
    setReminderDismissed(true);
  }

  const [portal, setPortal] = useState<PortalOrigin | null>(null);

  const openPortal = (e: React.MouseEvent<HTMLElement>, to: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    (e.currentTarget as HTMLElement).classList.add("is-leaving");
    setPortal({ x: rect.left, y: rect.top, w: rect.width, h: rect.height, to });
  };

  return (
    <AppShell>
      <GardenBackdrop />
      <LeafRain />
      <PortalTransition origin={portal} onDone={() => setPortal(null)} />

      {/* Header / saludo */}
      <section className="relative animate-sprout">
        <p className="text-sm text-muted-foreground">{greeting},</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight text-foreground mt-1">
          {user?.name.split(" ")[0]}, tu cartera está floreciendo.
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl">{heroMessage}</p>
      </section>

      {/* Weekly AI Digest */}
      <section className="rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-start gap-4 shadow-soft">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary shrink-0 mt-0.5">
          <Sparkles className="h-4 w-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
            Resumen de la semana
            {digest && <span className="ml-2 text-muted-foreground normal-case tracking-normal font-normal">· {digest.weekLabel}</span>}
          </p>
          {digestLoading ? (
            <div className="space-y-1.5">
              <div className="h-3 bg-primary/10 rounded animate-pulse w-full" />
              <div className="h-3 bg-primary/10 rounded animate-pulse w-4/5" />
            </div>
          ) : digest ? (
            <p className="text-sm text-foreground/85 leading-relaxed">{digest.summary}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Resumen no disponible — configura OPENAI_API_KEY para activarlo.</p>
          )}
        </div>
        {!digestLoading && (
          <button
            type="button"
            title="Actualizar resumen"
            className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
            onClick={() => {
              setDigestLoading(true);
              getWeeklyDigest(true).then((r) => { if (!isAiError(r)) setDigest(r); }).catch(() => {}).finally(() => setDigestLoading(false));
            }}
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        )}
      </section>

      {error && (
        <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {!loadingVisits && visitsToday.length > 0 && !reminderDismissed && (
        <Alert className="mt-6 border-primary/30 bg-primary/5">
          <Calendar className="h-4 w-4 text-primary" />
          <AlertTitle className="font-display">Tienes {visitsToday.length} {visitsToday.length === 1 ? "visita" : "visitas"} hoy</AlertTitle>
          <AlertDescription className="mt-2 space-y-2">
            {visitsToday.map((v) => {
              const d = new Date(v.date);
              return (
                <div key={v.id} className="flex items-center justify-between gap-3 text-sm">
                  <span>
                    <strong>{v.lead?.name ?? "Interesado"}</strong>
                    {" · "}
                    {v.property?.title}
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground shrink-0">
                    <Clock className="h-3.5 w-3.5" />
                    {d.toLocaleString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
            <div className="flex items-center gap-2 pt-1">
              <Button asChild variant="soft" size="sm">
                <Link href="/app/visitas">Ver agenda</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={dismissReminder}>
                <X className="h-3.5 w-3.5" /> Descartar
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Cultivar nuevo — barra compacta de acciones */}
      <section className="mt-6">
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-surface/80 backdrop-blur px-2 py-2 shadow-soft w-fit max-w-full">
          <span className="hidden sm:flex items-center gap-1.5 px-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            <Sprout className="h-3.5 w-3.5 text-primary/70" /> Cultivar nuevo
          </span>
          <span className="hidden sm:block h-5 w-px bg-border" />
          {can(user?.role, "properties.create") && <QuickPill href="/app/propiedades/nueva" icon={Plus} label="Propiedad" />}
          <QuickPill href="/app/leads" icon={UserPlus} label="Lead" />
          <QuickPill href="/app/oportunidades" icon={Sprout} label="Oportunidad" />
          <QuickPill href="/app/visitas" icon={CalendarPlus} label="Visita" />
          <QuickPill href="/app/documentos" icon={Upload} label="Documento" />
          {can(user?.role, "finances.view") && <QuickPill href="/app/ingresos" icon={Coins} label="Ingreso" />}
          {can(user?.role, "finances.view") && <QuickPill href="/app/gastos" icon={Receipt} label="Gasto" />}
          {can(user?.role, "reports.view") && <QuickPill href="/app/reportes" icon={BarChart3} label="Reporte" />}
        </div>
      </section>

      {/* KPIs — Tu jardín operativo */}
      <section className="mt-10">
        <SectionTitle eyebrow="Vista del día" title="Tu jardín operativo" />
        <WoodenShelf>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
            <PlanterMetric label="Propiedades activas" value={dash ? dash.byStatus.disponible + dash.byStatus.reservada : null} hint="Propiedades vivas" icon={Home} tone="primary" onClick={(e) => openPortal(e, "/app/propiedades")} />
            <PlanterMetric label="Disponibles" value={dash?.byStatus.disponible} hint="Listas para recibir interesados" icon={Leaf} tone="secondary" onClick={(e) => openPortal(e, "/app/propiedades?estado=disponible")} />
            <PlanterMetric label="Oportunidades" value={dash?.opportunities} hint="Relaciones en crecimiento" icon={Sprout} tone="accent" onClick={(e) => openPortal(e, "/app/oportunidades")} />
            <PlanterMetric label="Visitas" value={dash?.upcomingVisits} hint="Encuentros esta semana" icon={Calendar} tone="primary" onClick={(e) => openPortal(e, "/app/visitas")} />
            {can(user?.role, "finances.view") && (
              <PlanterMetric label="Balance" value={dash ? fmtCLP(dash.balance) : null} hint="Cosecha neta del mes" icon={Wallet} tone="accent" big onClick={(e) => openPortal(e, "/app/reportes")} />
            )}
          </div>
        </WoodenShelf>
      </section>

      {/* Salud de cartera y pipeline */}
      <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <PortfolioHealthCard dash={dash} />
        <PipelineGrowthCard dash={dash} />
      </section>

      {/* Visitas, documentos, alertas */}
      <section className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <UpcomingVisitsCard upcoming={upcoming} loading={loadingVisits} />
        <DocumentsCareCard dash={dash} />
        <SoftAlertsPanel dash={dash} />
      </section>

      {/* Cosecha del mes + actividad */}
      {can(user?.role, "finances.view") && (
        <section className="mt-6">
          <MonthlyHarvestFinanceCard dash={dash} />
        </section>
      )}

      <section className="mt-6">
        <ActivityVineTimeline activity={activity} loading={loadingActivity} />
      </section>
    </AppShell>
  );
}

/* ---------- Decor ---------- */

function GardenBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.5]" style={{ backgroundImage: "var(--gradient-garden)" }} />
      <div className="absolute inset-0 bg-grain opacity-[0.18]" />
      <svg className="absolute -top-12 -right-12 w-[420px] h-[420px] text-primary/[0.06]" viewBox="0 0 200 200" fill="currentColor">
        <path d="M100 20 C 130 60, 160 80, 180 110 C 150 120, 120 110, 100 90 C 80 110, 50 120, 20 110 C 40 80, 70 60, 100 20 Z" />
      </svg>
    </div>
  );
}

function WoodenShelf({ children }: { children: React.ReactNode }) {
  return <div className="mt-5">{children}</div>;
}

function SectionTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground/80">{eyebrow}</p>
        <h2 className="font-display text-2xl font-semibold mt-1 text-foreground">{title}</h2>
      </div>
      {action}
    </div>
  );
}

/* ---------- Planter metric (KPI card) ---------- */

function PlanterMetric({ label, value, hint, icon: Icon, tone, big, onClick }: { label: string; value: React.ReactNode; hint?: string; icon: typeof Home; tone: "primary" | "secondary" | "accent"; big?: boolean; onClick?: (e: React.MouseEvent<HTMLElement>) => void }) {
  const topBar = {
    primary: "from-primary/60 via-primary/30 to-transparent",
    secondary: "from-secondary/60 via-secondary/30 to-transparent",
    accent: "from-accent/60 via-accent/30 to-transparent",
  }[tone];
  const iconTone = {
    primary: "bg-primary/10 text-primary ring-primary/15",
    secondary: "bg-secondary/15 text-secondary ring-secondary/15",
    accent: "bg-accent/15 text-accent ring-accent/15",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className="portal-card group relative overflow-hidden rounded-[1.25rem] border border-border bg-surface px-5 py-5 shadow-soft text-left hover:shadow-leaf focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 w-full"
      style={{
        backgroundImage:
          "linear-gradient(180deg, hsl(var(--surface)) 0%, hsl(var(--surface)) 70%, hsl(var(--surface-muted)) 100%)",
      }}
    >
      <div aria-hidden className={cn("absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r", topBar)} />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
          <div className={cn("font-display font-semibold mt-2.5 text-foreground tabular-nums", big ? "text-2xl md:text-[1.75rem]" : "text-3xl")}>
            {value === null || value === undefined ? <Skeleton className="h-8 w-16" /> : value}
          </div>
          {hint && <p className="text-xs text-muted-foreground mt-2 leading-snug">{hint}</p>}
        </div>
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl ring-1 shrink-0 transition-transform duration-300 group-hover:rotate-[-6deg] group-hover:scale-110", iconTone)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </button>
  );
}

/* ---------- Quick action pill ---------- */

function QuickPill({ href, icon: Icon, label }: { href: string; icon: typeof Plus; label: string }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-foreground/80 hover:text-foreground hover:bg-accent-soft/50 transition-colors"
    >
      <Icon className="h-3.5 w-3.5 text-primary/70 group-hover:text-primary" />
      <span className="font-medium">{label}</span>
    </Link>
  );
}

/* ---------- Jardineras ---------- */

function Planter({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <article className={cn("relative rounded-3xl border border-border bg-surface p-6 shadow-soft overflow-hidden", className)}>
      {/* borde superior tipo tierra */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary/40 via-primary/30 to-accent/30" aria-hidden />
      {children}
    </article>
  );
}

function PortfolioHealthCard({ dash }: { dash: Dash | null }) {
  return (
    <Planter className="lg:col-span-2">
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Home className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cama de cultivo</p>
            <h3 className="font-display text-xl font-semibold">Estado de mi cartera</h3>
          </div>
        </div>
        <Link href="/app/propiedades" className="text-sm text-primary hover:underline inline-flex items-center gap-1">
          Ver todas <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatusCell label="Disponibles" value={dash?.byStatus.disponible} tone="primary" filter="disponible" />
        <StatusCell label="Reservadas" value={dash?.byStatus.reservada} tone="accent" filter="reservada" />
        <StatusCell label="Arrendadas" value={dash?.byStatus.arrendada} tone="secondary" filter="arrendada" />
        <StatusCell label="Inactivas" value={dash?.byStatus.inactiva} tone="muted" filter="inactiva" />
      </div>

      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <CareRow icon={AlertTriangle} tone="warning" label="Sin imagen principal" value={dash?.portfolioIssues.sinImagen} />
        <CareRow icon={FileText} tone="info" label="Información incompleta" value={dash?.portfolioIssues.incompletas} />
      </div>
    </Planter>
  );
}

function PipelineGrowthCard({ dash }: { dash: Dash | null }) {
  const max = Math.max(1, ...(dash?.pipeline.map((s) => s.count) ?? [1]));
  const stageIcon = [Sprout, Leaf, TreeDeciduous, Flower2, CheckCircle2];
  return (
    <Planter>
      <header className="flex items-center gap-3 mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
          <Sprout className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Pipeline</p>
          <h3 className="font-display text-xl font-semibold">Oportunidades en crecimiento</h3>
        </div>
      </header>

      {!dash ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <ul className="space-y-3">
          {dash.pipeline.map((s, i) => {
            const Icon = stageIcon[i] ?? Sprout;
            const pct = (s.count / max) * 100;
            return (
              <li key={s.key}>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <Icon className="h-4 w-4 text-primary/70" />
                    <strong className="font-medium">{s.label}</strong>
                    <span className="text-muted-foreground">· {s.description}</span>
                  </span>
                  <span className="font-display tabular-nums text-foreground">{s.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-secondary to-primary" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Link href="/app/oportunidades" className="mt-5 inline-flex items-center gap-1 text-sm text-primary hover:underline">
        Ir al pipeline <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Planter>
  );
}

function UpcomingVisitsCard({ upcoming, loading }: { upcoming: Visits; loading: boolean }) {
  return (
    <Planter>
      <header className="flex items-center gap-3 mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Calendar className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Agenda</p>
          <h3 className="font-display text-xl font-semibold">Visitas próximas</h3>
        </div>
      </header>

      {loading ? (
        <div className="space-y-3"><Skeleton className="h-12" /><Skeleton className="h-12" /><Skeleton className="h-12" /></div>
      ) : upcoming.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Tu agenda está tranquila por ahora."
          description="No hay visitas programadas."
          ctaLabel="Agendar visita"
          ctaTo="/app/visitas"
        />
      ) : (
        <ul className="space-y-3">
          {upcoming.slice(0, 4).map((v) => {
            const d = new Date(v.date);
            const today = new Date();
            const diffDays = Math.floor((d.getTime() - today.getTime()) / 86400000);
            const when =
              diffDays === 0 ? "Hoy" : diffDays === 1 ? "Mañana" : diffDays < 7 ? "Esta semana" : d.toLocaleDateString("es-CL", { day: "numeric", month: "short" });
            return (
              <li key={v.id} className="flex items-start gap-3 rounded-xl bg-background/50 border border-border/60 p-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-foreground truncate">{v.lead?.name}</p>
                    <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-accent-soft/60 text-accent-foreground/80 shrink-0">{when}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{v.property?.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{d.toLocaleString("es-CL", { hour: "2-digit", minute: "2-digit" })} hrs</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Planter>
  );
}

function DocumentsCareCard({ dash }: { dash: Dash | null }) {
  return (
    <Planter>
      <header className="flex items-center gap-3 mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <FileText className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Raíces</p>
          <h3 className="font-display text-xl font-semibold">Documentos por cuidar</h3>
        </div>
      </header>
      {!dash ? (
        <Skeleton className="h-32" />
      ) : (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            Hay documentos que necesitan atención para mantener tu operación bien respaldada.
          </p>
          <div className="space-y-2">
            <CareRow icon={FileText} tone="info" label="Por cargar" value={dash.documents.aplicacionesIncompletas} />
            <CareRow icon={FileText} tone="info" label="Sin verificar" value={dash.documents.sinVerificar} />
            <CareRow icon={AlertTriangle} tone="warning" label="Rechazados" value={dash.documents.rechazados} />
            <CareRow icon={Home} tone="info" label="Propiedades sin docs" value={dash.documents.propiedadesSinDocs} />
          </div>
          <Link href="/app/documentos" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            Ir a documentos <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </>
      )}
    </Planter>
  );
}

function SoftAlertsPanel({ dash }: { dash: Dash | null }) {
  return (
    <Planter>
      <header className="flex items-center gap-3 mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <AlertTriangle className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Cuidado suave</p>
          <h3 className="font-display text-xl font-semibold">Alertas</h3>
        </div>
      </header>
      {!dash ? (
        <Skeleton className="h-32" />
      ) : dash.alerts.length === 0 ? (
        <div className="flex items-start gap-3 rounded-xl bg-secondary/10 border border-secondary/20 px-4 py-3">
          <CheckCircle2 className="h-4 w-4 text-secondary mt-0.5 shrink-0" />
          <p className="text-sm text-foreground">Tu jardín está en orden. No hay pendientes críticos por ahora.</p>
        </div>
      ) : (
        <ul className="space-y-2.5">
          {dash.alerts.map((a) => (
            <li key={a.id} className={cn(
              "flex items-start gap-3 rounded-xl px-4 py-3 border",
              a.level === "warning" ? "bg-accent-soft/40 border-accent/25" : "bg-primary/5 border-primary/15",
            )}>
              <AlertTriangle className={cn("h-4 w-4 mt-0.5 shrink-0", a.level === "warning" ? "text-accent" : "text-primary/70")} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground">{a.message}</p>
                <Link href={a.to} className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-0.5">
                  {a.action} <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Planter>
  );
}

function ActivityVineTimeline({ activity, loading }: { activity: Activity; loading: boolean }) {
  return (
    <Planter>
      <header className="flex items-center gap-3 mb-5">
        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary/15 text-secondary">
          <Leaf className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Enredadera</p>
          <h3 className="font-display text-xl font-semibold">Actividad reciente</h3>
        </div>
      </header>
      {loading ? (
        <Skeleton className="h-40" />
      ) : activity.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aún no hay actividad. Lo que cuides aquí va a crecer.</p>
      ) : (
        <ol className="relative pl-5 space-y-4 before:absolute before:left-1.5 before:top-1 before:bottom-1 before:w-px before:bg-gradient-to-b before:from-secondary/40 before:via-primary/20 before:to-transparent">
          {activity.map((a) => {
            const Icon = ACTIVITY_ICON[a.type] ?? Sprout;
            return (
              <li key={a.id} className="relative">
                <span className="absolute -left-[18px] top-1 h-3 w-3 rounded-full bg-surface border-2 border-primary/40" />
                <div className="flex items-start gap-2">
                  <Icon className="h-3.5 w-3.5 text-primary/70 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm text-foreground">
                      <strong className="font-medium">{a.userName}</strong> · {a.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[a.entityLabel, formatActivityDate(a.date)].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Planter>
  );
}

function MonthlyHarvestFinanceCard({ dash }: { dash: Dash | null }) {
  const positive = (dash?.balance ?? 0) >= 0;
  const delta = dash ? dash.balance - dash.previousBalance : 0;
  return (
    <Planter>
      <header className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Wallet className="h-5 w-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Cosecha</p>
            <h3 className="font-display text-xl font-semibold">Balance del mes</h3>
          </div>
        </div>
        <Button variant="soft" size="sm">
          <BarChart3 className="h-4 w-4" />
          Exportar
        </Button>
      </header>

      {!dash ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-4">
            <FinanceTile label="Ingresos" value={fmtCLP(dash.ingresos)} tone="primary" icon={TrendingUp} />
            <FinanceTile label="Gastos" value={fmtCLP(dash.gastos)} tone="muted" icon={TrendingDown} />
            <FinanceTile
              label="Balance neto"
              value={fmtCLP(dash.balance)}
              tone={positive ? "secondary" : "warning"}
              icon={positive ? TrendingUp : AlertTriangle}
              hint={`${delta >= 0 ? "+" : ""}${fmtCLP(delta)} vs mes anterior`}
            />
          </div>

          <div className="lg:col-span-2 rounded-2xl bg-background/50 border border-border/60 p-4">
            <p className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Tendencia 6 meses</p>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dash.trend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="ing" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--surface))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }}
                    formatter={(v: number) => fmtCLP(v)}
                  />
                  <Area type="monotone" dataKey="ingresos" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#ing)" />
                  <Area type="monotone" dataKey="gastos" stroke="hsl(var(--accent))" strokeWidth={2} fill="url(#gas)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl bg-background/50 border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Mejor rendimiento</p>
              <ul className="space-y-2">
                {dash.topProperties.map((t) => (
                  <li key={t.property.id} className="flex items-center justify-between text-sm">
                    <span className="truncate text-foreground">{t.property.title}</span>
                    <span className="font-display tabular-nums text-foreground shrink-0 ml-3">{fmtCLP(t.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-background/50 border border-border/60 p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground mb-3">Categorías de gasto</p>
              <ul className="space-y-2">
                {dash.expenseCategories.map((c) => (
                  <li key={c.label} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{c.label}</span>
                    <span className="font-display tabular-nums text-foreground">{fmtCLP(c.amount)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </Planter>
  );
}

/* ---------- Helpers UI ---------- */

function StatusCell({ label, value, tone, filter }: { label: string; value?: number; tone: "primary" | "secondary" | "accent" | "muted"; filter: string }) {
  const dot = {
    primary: "bg-primary", secondary: "bg-secondary", accent: "bg-accent", muted: "bg-muted-foreground/60",
  }[tone];
  return (
    <Link
      href={`/app/propiedades?estado=${filter}`}
      className="rounded-2xl bg-background/60 border border-border px-4 py-3 hover:border-primary/30 transition-colors block"
    >
      <div className="flex items-center gap-2">
        <span className={cn("h-2 w-2 rounded-full", dot)} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <div className="font-display text-2xl font-semibold mt-1 text-foreground tabular-nums">
        {value === undefined ? <Skeleton className="h-7 w-10" /> : value}
      </div>
    </Link>
  );
}

function CareRow({ icon: Icon, tone, label, value }: { icon: typeof FileText; tone: "warning" | "info"; label: string; value?: number }) {
  const cls = tone === "warning" ? "text-accent" : "text-primary/70";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-background/50 border border-border/60 px-3 py-2">
      <span className="flex items-center gap-2 text-sm text-foreground">
        <Icon className={cn("h-4 w-4", cls)} />
        {label}
      </span>
      <span className="font-display tabular-nums text-sm text-foreground">{value ?? 0}</span>
    </div>
  );
}

function FinanceTile({ label, value, tone, icon: Icon, hint }: { label: string; value: string; tone: "primary" | "secondary" | "muted" | "warning"; icon: typeof TrendingUp; hint?: string }) {
  const cls = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/15 text-secondary",
    muted: "bg-muted text-muted-foreground",
    warning: "bg-accent/15 text-accent",
  }[tone];
  return (
    <div className="rounded-2xl bg-background/50 border border-border/60 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <span className={cn("flex h-8 w-8 items-center justify-center rounded-xl", cls)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <p className="font-display text-2xl font-semibold mt-2 text-foreground tabular-nums">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, description, ctaLabel, ctaTo }: { icon: typeof Calendar; title: string; description: string; ctaLabel: string; ctaTo: string }) {
  return (
    <div className="flex flex-col items-center text-center py-8">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-3">
        <Icon className="h-5 w-5" />
      </span>
      <p className="font-medium text-foreground">{title}</p>
      <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-xs">{description}</p>
      <Button asChild variant="soft" size="sm"><Link href={ctaTo}>{ctaLabel}</Link></Button>
    </div>
  );
}
