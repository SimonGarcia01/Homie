import { Home, Sprout, CalendarCheck, FileText, Wallet, TrendingUp } from "lucide-react";

const features = [
  {
    id: "cartera",
    icon: Home,
    title: "Tu cartera, como un jardín",
    body: "Cada propiedad tiene su lugar. Imágenes, propietarios, contratos y notas, todo cuidado en un mismo espacio.",
    tone: "bg-primary/10 text-primary",
  },
  {
    id: "oportunidades",
    icon: Sprout,
    title: "Oportunidades en crecimiento",
    body: "Acompaña a cada interesado desde el primer contacto hasta el cierre con un pipeline tranquilo y claro.",
    tone: "bg-secondary/15 text-secondary",
  },
  {
    id: "visitas",
    icon: CalendarCheck,
    title: "Visitas con calma",
    body: "Agenda, recuerda y haz seguimiento sin estrés. Cada visita es un paso de cuidado para tu oportunidad.",
    tone: "bg-accent/15 text-accent",
  },
  {
    id: "cuidado",
    icon: FileText,
    title: "Documentos en orden",
    body: "Contratos, certificados y soportes guardados como raíces firmes para cada proceso de arriendo.",
    tone: "bg-warning/15 text-warning",
  },
  {
    id: "finanzas",
    icon: Wallet,
    title: "Finanzas claras",
    body: "Cobros, pagos y balances mensuales presentados con calidez y sin números que abrumen.",
    tone: "bg-success/15 text-success",
  },
  {
    id: "reportes",
    icon: TrendingUp,
    title: "Reportes para cosechar",
    body: "Resúmenes mensuales listos para enviar al propietario con la confianza de un trabajo bien hecho.",
    tone: "bg-primary/10 text-primary",
  },
];

export const Features = () => (
  <section id="producto" className="relative bg-background py-24 md:py-32">
    <div className="container">
      <div className="max-w-2xl">
        <span className="text-xs uppercase tracking-[0.18em] text-secondary font-medium">Tu espacio operativo</span>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-medium leading-tight text-foreground">
          Una plataforma que cuida lo que tú cuidas.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Homie no es un CRM frío. Es un lugar tranquilo para organizar tu cartera, atender a tus clientes y mantener cada documento en su sitio.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => (
          <article
            key={f.title}
            id={f.id}
            className="group rounded-3xl border border-border bg-surface p-6 shadow-soft transition-all duration-500 hover:shadow-card hover:-translate-y-1 scroll-mt-24"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${f.tone}`}>
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-xl text-foreground">{f.title}</h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">{f.body}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
