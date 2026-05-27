import Link from "next/link";
import { Heart, Search, CalendarCheck, ClipboardList, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Search,
    title: "Explora sin fricción",
    body: "Navega propiedades de distintos brokers. Filtra por comuna, precio y broker.",
    tone: "bg-accent/15 text-accent",
  },
  {
    icon: MapPin,
    title: "Fichas completas",
    body: "Fotos, precio, dormitorios, ubicación y quién publica — todo antes de contactar.",
    tone: "bg-primary/10 text-primary",
  },
  {
    icon: Heart,
    title: "Tus favoritos",
    body: "Guarda las que te gustan y compáralas cuando quieras, desde tu cuenta.",
    tone: "bg-secondary/15 text-secondary",
  },
  {
    icon: CalendarCheck,
    title: "Pide una visita",
    body: "Solicita visita o haz una consulta. El broker recibe tu interés al instante.",
    tone: "bg-warning/15 text-warning",
  },
  {
    icon: ClipboardList,
    title: "Sigue tus solicitudes",
    body: "Ve el estado de cada consulta: recibida, en contacto, visita confirmada.",
    tone: "bg-success/15 text-success",
  },
  {
    icon: Building2,
    title: "Varios brokers",
    body: "Un portal, muchas inmobiliarias. Encuentra opciones sin saltar entre sitios.",
    tone: "bg-accent/15 text-accent",
  },
];

export const FeaturesSeekers = () => (
  <section id="buscar-arriendo" className="relative bg-surface-muted/40 py-24 md:py-32 scroll-mt-24">
    <div className="container">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-14">
        <div className="max-w-2xl">
          <span className="text-xs uppercase tracking-[0.18em] text-accent font-medium">Para arrendatarios</span>
          <h2 className="mt-3 font-display text-4xl md:text-5xl font-medium leading-tight text-foreground">
            Buscar arriendo, sin complicaciones.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Homie te ayuda a encontrar propiedades, guardar las que te interesan y coordinar visitas con el broker — todo desde un portal pensado para ti.
          </p>
        </div>
        <Button asChild variant="hero" size="lg" className="shrink-0 w-fit">
          <Link href="/buscar">Ir al catálogo</Link>
        </Button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f) => (
          <article
            key={f.title}
            className="rounded-3xl border border-border bg-surface p-6 shadow-soft transition-all hover:shadow-card hover:-translate-y-0.5"
          >
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${f.tone}`}>
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-xl text-foreground">{f.title}</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed text-sm">{f.body}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
