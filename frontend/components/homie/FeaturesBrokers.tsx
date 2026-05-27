import { Home, Sprout, CalendarCheck, FileText, Wallet, TrendingUp, Inbox, Bot } from "lucide-react";

const features = [
  {
    id: "cartera",
    icon: Home,
    title: "Tu cartera, como un jardín",
    body: "Propiedades, fotos, propietarios y publicación al catálogo — todo en un mismo espacio.",
    tone: "bg-primary/10 text-primary",
  },
  {
    id: "leads-portal",
    icon: Sprout,
    title: "Leads desde el portal",
    body: "Los interesados del catálogo llegan a Semillero con la propiedad ya vinculada.",
    tone: "bg-secondary/15 text-secondary",
  },
  {
    id: "oportunidades",
    icon: TrendingUp,
    title: "Pipeline claro",
    body: "Acompaña cada oportunidad desde el primer contacto hasta el cierre.",
    tone: "bg-accent/15 text-accent",
  },
  {
    id: "visitas",
    icon: CalendarCheck,
    title: "Visitas con calma",
    body: "Agenda, reprograma y marca visitas realizadas sin perder el hilo.",
    tone: "bg-warning/15 text-warning",
  },
  {
    id: "inbox",
    icon: Inbox,
    title: "Inbox por lead",
    body: "Conversaciones y seguimiento centralizados por interesado.",
    tone: "bg-success/15 text-success",
  },
  {
    id: "cuidado",
    icon: FileText,
    title: "Documentos en orden",
    body: "Contratos, certificados y soportes guardados para cada proceso.",
    tone: "bg-primary/10 text-primary",
  },
  {
    id: "finanzas",
    icon: Wallet,
    title: "Finanzas claras",
    body: "Ingresos, gastos y balances mensuales sin números que abrumen.",
    tone: "bg-secondary/15 text-secondary",
  },
  {
    id: "asistente",
    icon: Bot,
    title: "Asistente Homie",
    body: "Consulta tu CRM, busca leads y resume conversaciones en lenguaje natural.",
    tone: "bg-accent/15 text-accent",
  },
];

export const FeaturesBrokers = () => (
  <section id="producto" className="relative bg-background py-24 md:py-32 scroll-mt-24">
    <div className="container">
      <div className="max-w-2xl">
        <span className="text-xs uppercase tracking-[0.18em] text-primary font-medium">Para brokers</span>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-medium leading-tight text-foreground">
          Un CRM que cuida lo que tú cuidas.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Homie no es una planilla fría. Es un lugar tranquilo para operar tu cartera, atender interesados del portal y mantener cada documento en su sitio.
        </p>
      </div>

      <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        {features.map((f) => (
          <article
            key={f.title}
            id={f.id}
            className="group rounded-3xl border border-border bg-surface p-6 shadow-soft transition-all duration-500 hover:shadow-card hover:-translate-y-1 scroll-mt-24"
          >
            <span className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl ${f.tone}`}>
              <f.icon className="h-5 w-5" />
            </span>
            <h3 className="mt-5 font-display text-lg text-foreground">{f.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.body}</p>
          </article>
        ))}
      </div>
    </div>
  </section>
);
