import Link from "next/link";
import { Button } from "@/components/ui/button";
import { LeafBackdrop } from "./Decor";
import {
  ArrowRight, Home, Sprout, ShieldCheck, Search, Building2,
} from "lucide-react";

export const Hero = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-warm">
      <LeafBackdrop />

      <div className="container relative z-10 pt-10 pb-24 md:pt-16 md:pb-32">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/70 backdrop-blur px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
              <Sprout className="h-3.5 w-3.5 text-primary" />
              Para quien busca arriendo y para quien lo gestiona
            </span>

            <h1 className="mt-6 font-display text-5xl md:text-6xl lg:text-7xl font-medium leading-[1.02] text-foreground">
              Tu próximo hogar
              <span className="block italic text-primary">y tu cartera, en un solo lugar.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-muted-foreground leading-relaxed">
              Homie conecta a arrendatarios con propiedades de distintos brokers, y les da a otros brokers un espacio cálido para operar leads, visitas, documentos y finanzas.
            </p>

            <div className="mt-9 grid sm:grid-cols-2 gap-3 max-w-lg">
              <Button asChild variant="hero" size="xl" className="group h-auto py-4 flex-col items-start gap-1">
                <Link href="/buscar">
                  <span className="flex items-center gap-2 w-full">
                    <Search className="h-4 w-4 shrink-0" />
                    Buscar arriendo
                    <ArrowRight className="h-4 w-4 ml-auto transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="text-xs font-normal opacity-80 text-left">Explora sin cuenta · Regístrate para visitas</span>
                </Link>
              </Button>
              <Button asChild variant="soft" size="xl" className="group h-auto py-4 flex-col items-start gap-1">
                <Link href="/login">
                  <span className="flex items-center gap-2 w-full">
                    <Building2 className="h-4 w-4 shrink-0" />
                    Soy broker
                    <ArrowRight className="h-4 w-4 ml-auto transition-transform group-hover:translate-x-0.5" />
                  </span>
                  <span className="text-xs font-normal opacity-80 text-left">CRM para tu operación diaria</span>
                </Link>
              </Button>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Multi-broker
              </div>
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-secondary" />
                Catálogo público
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 animate-scale-in">
            <DualPreview />
          </div>
        </div>
      </div>
    </section>
  );
};

const DualPreview = () => {
  return (
    <div className="relative grid gap-4">
      {/* B2C preview card */}
      <div className="rounded-3xl border border-border bg-surface/95 backdrop-blur p-5 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-accent uppercase tracking-wide">Para arrendatarios</span>
          <span className="text-xs text-muted-foreground">/buscar</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: "Depto. Las Acacias", city: "Providencia", price: "$650.000" },
            { title: "Casa Olivos 24", city: "Ñuñoa", price: "$890.000" },
          ].map((p) => (
            <div key={p.title} className="rounded-2xl bg-muted/60 border border-border overflow-hidden">
              <div className="aspect-[4/3] bg-primary/10" />
              <div className="p-2.5">
                <p className="text-xs font-medium truncate">{p.title}</p>
                <p className="text-[10px] text-muted-foreground">{p.city}</p>
                <p className="text-xs text-primary font-semibold mt-0.5">{p.price}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Guarda favoritos · Pide visitas · Sigue tus solicitudes</p>
      </div>

      {/* B2B preview card — overlaps slightly */}
      <div className="rounded-3xl border border-border bg-surface/95 backdrop-blur p-5 shadow-leaf md:-mt-2 md:ml-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium text-primary uppercase tracking-wide">Para brokers</span>
          <span className="text-xs text-muted-foreground">/app</span>
        </div>
        <div className="rounded-2xl bg-gradient-leaf text-primary-foreground p-4 mb-3">
          <p className="text-xs opacity-80">Vista general</p>
          <p className="font-display text-lg mt-0.5">3 leads nuevos desde el portal</p>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Propiedades", value: "24" },
            { label: "Leads", value: "11" },
            { label: "Visitas", value: "4" },
          ].map((s) => (
            <div key={s.label} className="rounded-xl bg-surface-muted/60 border border-border p-2 text-center">
              <div className="font-display text-lg">{s.value}</div>
              <div className="text-[10px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
