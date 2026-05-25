import { Sprout, Handshake, KeyRound, ClipboardCheck } from "lucide-react";

const steps = [
  { icon: Sprout, label: "Siembra", title: "Captura el interés", body: "Cada lead llega ordenado, listo para crecer." },
  { icon: Handshake, label: "Cuidado", title: "Agenda visitas con calma", body: "Acompaña al interesado en cada paso." },
  { icon: ClipboardCheck, label: "Raíz", title: "Aplicación y documentos", body: "Soportes guardados con confianza." },
  { icon: KeyRound, label: "Cosecha", title: "Cierre y entrega", body: "Contrato firmado, llaves en su hogar." },
];

export const Cultivate = () => (
  <section id="operacion" className="relative bg-surface-muted/60 py-24 md:py-32 overflow-hidden">
    <div aria-hidden className="absolute inset-0 bg-grain opacity-30 mix-blend-multiply pointer-events-none" />
    <div className="container relative">
      <div className="max-w-2xl">
        <span className="text-xs uppercase tracking-[0.18em] text-accent font-medium">El ciclo del arriendo</span>
        <h2 className="mt-3 font-display text-4xl md:text-5xl font-medium leading-tight text-foreground">
          Cultiva relaciones, cosecha contratos.
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Homie acompaña tu operación como un jardinero acompaña sus plantas: con orden, ritmo y atención.
        </p>
      </div>

      <ol className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-4 relative">
        {steps.map((s, i) => (
          <li key={s.label} className="relative rounded-3xl bg-surface border border-border p-6 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-leaf text-primary-foreground">
                <s.icon className="h-5 w-5" />
              </span>
              <span className="font-display text-3xl text-muted-foreground/40">0{i + 1}</span>
            </div>
            <div className="mt-5 text-xs uppercase tracking-wider text-secondary font-medium">{s.label}</div>
            <h3 className="mt-1 font-display text-xl text-foreground">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
          </li>
        ))}
      </ol>
    </div>
  </section>
);
