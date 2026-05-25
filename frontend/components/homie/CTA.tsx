import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sprout } from "lucide-react";

export const CTA = () => (
  <section className="relative py-24 md:py-32 bg-background overflow-hidden">
    <div className="container">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-leaf p-10 md:p-16 shadow-leaf">
        {/* botanical decoration */}
        <svg aria-hidden className="absolute -right-10 -bottom-10 w-[420px] opacity-20 text-primary-foreground" viewBox="0 0 400 400" fill="none">
          <path d="M200 40 C 260 120, 320 180, 280 300 C 240 360, 160 360, 120 300 C 80 180, 140 120, 200 40 Z" fill="currentColor"/>
        </svg>
        <svg aria-hidden className="absolute -left-16 -top-16 w-[320px] opacity-15 text-primary-foreground" viewBox="0 0 400 400" fill="none">
          <circle cx="200" cy="200" r="160" stroke="currentColor" strokeWidth="2"/>
          <circle cx="200" cy="200" r="100" stroke="currentColor" strokeWidth="2"/>
        </svg>

        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 backdrop-blur px-3 py-1 text-xs font-medium text-primary-foreground/90">
            <Sprout className="h-3.5 w-3.5" />
            Comienza tu jardín
          </span>
          <h2 className="mt-5 font-display text-4xl md:text-5xl lg:text-6xl font-medium leading-[1.05] text-primary-foreground">
            Tu cartera inmobiliaria,
            <span className="block italic opacity-90">en calma y bajo control.</span>
          </h2>
          <p className="mt-5 text-lg text-primary-foreground/85 max-w-xl">
            Empieza a organizar propiedades, propietarios y contratos en un espacio diseñado para reducir el estrés operativo.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="xl" variant="warm" className="group">
              <Link href="/login">
                Entrar a Homie
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
            <Button asChild size="xl" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 rounded-full">
              <Link href="/login?demo=1">Explorar demo</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  </section>
);
