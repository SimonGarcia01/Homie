import { Button } from "@/components/ui/button";
import { LeafBackdrop } from "./Decor";
import { ArrowRight, Home, Sprout, FileText, CalendarCheck, Wallet, ShieldCheck, MapPin } from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-warm">
      <LeafBackdrop />

      <div className="container relative z-10 pt-10 pb-24 md:pt-16 md:pb-32">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Copy */}
          <div className="lg:col-span-6 animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 backdrop-blur px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
              <Sprout className="h-3.5 w-3.5 text-primary" />
              Cultivado para brokers y administradores
            </span>

            <h1 className="mt-6 font-display text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.02] text-foreground">
              Un hogar para
              <span className="block italic text-primary">gestionar tus arriendos.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Homie reúne propiedades, propietarios, interesados, visitas, documentos y finanzas en un espacio cálido, claro y diseñado para que los brokers trabajen con calma.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button variant="hero" size="xl" className="group">
                Entrar a Homie
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
              <Button variant="soft" size="xl">
                Ver catálogo
              </Button>
            </div>

            <div className="mt-10 flex items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Datos protegidos
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <Sprout className="h-4 w-4 text-secondary" />
                Sin contratos rígidos
              </div>
            </div>
          </div>

          {/* Dashboard preview */}
          <div className="lg:col-span-6 animate-scale-in">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
};

const DashboardPreview = () => {
  return (
    <div className="relative">
      {/* floating accent card */}
      <div className="absolute -top-6 -left-4 hidden md:flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card border border-border z-10">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-success/15 text-success">
          <CalendarCheck className="h-4 w-4" />
        </span>
        <div>
          <div className="text-xs text-muted-foreground">Próxima visita</div>
          <div className="text-sm font-medium text-foreground">Mañana, 10:30 — Calle Olivos 24</div>
        </div>
      </div>

      <div className="absolute -bottom-6 -right-4 hidden md:flex items-center gap-3 rounded-2xl bg-surface px-4 py-3 shadow-card border border-border z-10">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Wallet className="h-4 w-4" />
        </span>
        <div>
          <div className="text-xs text-muted-foreground">Balance del mes</div>
          <div className="text-sm font-medium text-foreground">+ $4.820.000 cobrados</div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-surface/95 backdrop-blur p-5 shadow-leaf">
        {/* top bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-accent/60"/>
            <div className="h-2.5 w-2.5 rounded-full bg-warning/60"/>
            <div className="h-2.5 w-2.5 rounded-full bg-success/60"/>
          </div>
          <div className="text-xs text-muted-foreground font-medium">homie · vista general</div>
        </div>

        {/* greeting */}
        <div className="rounded-2xl bg-gradient-leaf text-primary-foreground p-5 mb-4">
          <div className="text-xs opacity-80">Miércoles, 29 de abril</div>
          <h3 className="font-display text-2xl mt-1">Buenos días, tu cartera está en orden.</h3>
          <p className="text-sm opacity-90 mt-1">Tres oportunidades necesitan seguimiento hoy.</p>
        </div>

        {/* stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Propiedades", value: "24", icon: Home, tone: "bg-primary/10 text-primary" },
            { label: "Oportunidades", value: "11", icon: Sprout, tone: "bg-secondary/15 text-secondary" },
            { label: "Documentos", value: "6", icon: FileText, tone: "bg-accent/15 text-accent" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-surface-muted/60 border border-border p-3">
              <span className={`inline-flex h-8 w-8 items-center justify-center rounded-lg ${s.tone}`}>
                <s.icon className="h-4 w-4" />
              </span>
              <div className="mt-2 font-display text-2xl text-foreground">{s.value}</div>
              <div className="text-xs text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>

        {/* property rows */}
        <div className="space-y-2">
          {[
            { name: "Casa Olivos 24", status: "Disponible", tone: "bg-success/15 text-success" },
            { name: "Depto. Las Acacias 502", status: "En visita", tone: "bg-warning/15 text-warning" },
            { name: "Loft Jardines 7", status: "Arrendada", tone: "bg-primary/10 text-primary" },
          ].map((p) => (
            <div key={p.name} className="flex items-center justify-between rounded-xl bg-surface-muted/40 border border-border px-3 py-2.5">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface text-muted-foreground border border-border">
                  <MapPin className="h-3.5 w-3.5"/>
                </span>
                <span className="text-sm text-foreground">{p.name}</span>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${p.tone}`}>{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
