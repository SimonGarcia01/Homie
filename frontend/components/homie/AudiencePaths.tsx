import Link from "next/link";
import { ArrowRight, Building2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AudiencePaths = () => (
  <section className="relative bg-background py-20 md:py-28 border-b border-border/60">
    <div className="container">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <span className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium">
          Dos experiencias, una plataforma
        </span>
        <h2 className="mt-3 font-display text-3xl md:text-4xl font-medium text-foreground">
          ¿Qué estás buscando hoy?
        </h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* B2C path */}
        <article
          id="para-arrendatarios"
          className="group relative rounded-[2rem] border border-border bg-surface p-8 md:p-10 shadow-soft hover:shadow-card transition-all hover:-translate-y-1 scroll-mt-24 overflow-hidden"
        >
          <div aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
          <span className="inline-flex items-center gap-2 rounded-full bg-accent/15 text-accent px-3 py-1 text-xs font-medium">
            <Search className="h-3.5 w-3.5" />
            Busco arriendo
          </span>
          <h3 className="mt-5 font-display text-2xl md:text-3xl font-medium text-foreground">
            Encuentra tu próximo hogar
          </h3>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Explora propiedades de varios brokers en un solo lugar. Sin login puedes mirar; con cuenta guardas favoritos y pides visitas.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-foreground/85">
            {[
              "Catálogo multi-broker con búsqueda y filtros",
              "Ficha con fotos, precio y ubicación",
              "Favoritos y solicitudes de visita en tu cuenta",
              "Seguimiento del estado de tus consultas",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" className="group/btn">
              <Link href="/buscar">
                Explorar propiedades
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="soft">
              <Link href="/interesado/registro">Crear cuenta</Link>
            </Button>
          </div>
        </article>

        {/* B2B path */}
        <article
          id="para-brokers"
          className="group relative rounded-[2rem] border border-border bg-surface p-8 md:p-10 shadow-soft hover:shadow-card transition-all hover:-translate-y-1 scroll-mt-24 overflow-hidden"
        >
          <div aria-hidden className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/10 blur-2xl" />
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-medium">
            <Building2 className="h-3.5 w-3.5" />
            Soy broker
          </span>
          <h3 className="mt-5 font-display text-2xl md:text-3xl font-medium text-foreground">
            Gestiona tu operación con calma
          </h3>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Un CRM pensado para brokers: cartera, leads del portal, pipeline, visitas, documentos e ingresos en un espacio claro y cálido.
          </p>
          <ul className="mt-6 space-y-2.5 text-sm text-foreground/85">
            {[
              "Publica propiedades al catálogo multi-tenant",
              "Recibe leads desde el portal de arrendatarios",
              "Pipeline, inbox y agenda de visitas",
              "Documentos, finanzas y reportes para propietarios",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" className="group/btn">
              <Link href="/login">
                Entrar al CRM
                <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="soft">
              <Link href="/register">Registrar broker</Link>
            </Button>
          </div>
        </article>
      </div>
    </div>
  </section>
);
