import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Search, Building2 } from "lucide-react";

export const CTA = () => (
  <section className="relative py-24 md:py-32 bg-background overflow-hidden">
    <div className="container">
      <div className="grid md:grid-cols-2 gap-6">
        {/* B2C CTA */}
        <div className="relative overflow-hidden rounded-[2rem] bg-accent/10 border border-accent/20 p-10 md:p-12">
          <Search className="h-8 w-8 text-accent mb-4" />
          <h2 className="font-display text-3xl md:text-4xl font-medium text-foreground leading-tight">
            ¿Buscas arriendo?
          </h2>
          <p className="mt-4 text-muted-foreground max-w-sm">
            Explora propiedades de varios brokers. Regístrate gratis para guardar favoritos y pedir visitas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" className="group">
              <Link href="/buscar">
                Buscar propiedades
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild variant="soft">
              <Link href="/interesado/registro">Crear cuenta</Link>
            </Button>
          </div>
        </div>

        {/* B2B CTA */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-leaf p-10 md:p-12 shadow-leaf">
          <svg aria-hidden className="absolute -right-10 -bottom-10 w-[280px] opacity-20 text-primary-foreground" viewBox="0 0 400 400" fill="none">
            <path d="M200 40 C 260 120, 320 180, 280 300 C 240 360, 160 360, 120 300 C 80 180, 140 120, 200 40 Z" fill="currentColor"/>
          </svg>
          <Building2 className="relative h-8 w-8 text-primary-foreground mb-4" />
          <h2 className="relative font-display text-3xl md:text-4xl font-medium text-primary-foreground leading-tight">
            ¿Gestionas arriendos?
          </h2>
          <p className="relative mt-4 text-primary-foreground/85 max-w-sm">
            Publica al catálogo, recibe leads del portal y opera tu cartera con calma desde el CRM.
          </p>
          <div className="relative mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" variant="warm" className="group">
              <Link href="/register">
                Registrar broker
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 rounded-full">
              <Link href="/login?demo=1">Ver demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);
