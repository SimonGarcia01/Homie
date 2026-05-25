import { Sprout } from "lucide-react";

export const Footer = () => (
  <footer className="bg-surface border-t border-border">
    <div className="container py-12 grid gap-10 md:grid-cols-4">
      <div className="md:col-span-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-leaf">
            <Sprout className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-display text-xl font-semibold">Homie</span>
        </div>
        <p className="mt-4 text-sm text-muted-foreground max-w-sm">
          Un hogar digital para brokers y administradores que prefieren trabajar con calma.
        </p>
      </div>

      <div>
        <div className="text-sm font-medium text-foreground">Producto</div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li><a href="#" className="hover:text-foreground">Propiedades</a></li>
          <li><a href="#" className="hover:text-foreground">Oportunidades</a></li>
          <li><a href="#" className="hover:text-foreground">Documentos</a></li>
          <li><a href="#" className="hover:text-foreground">Finanzas</a></li>
        </ul>
      </div>

      <div>
        <div className="text-sm font-medium text-foreground">Homie</div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li><a href="#" className="hover:text-foreground">Sobre nosotros</a></li>
          <li><a href="#" className="hover:text-foreground">Privacidad</a></li>
          <li><a href="#" className="hover:text-foreground">Contacto</a></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="container py-5 text-xs text-muted-foreground flex justify-between">
        <span>© {new Date().getFullYear()} Homie · Hecho con cuidado.</span>
        <span>Cultivado para brokers.</span>
      </div>
    </div>
  </footer>
);
