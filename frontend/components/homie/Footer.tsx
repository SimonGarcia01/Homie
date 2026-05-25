import Link from "next/link";
import { Sprout } from "lucide-react";

export const Footer = () => (
  <footer className="bg-surface border-t border-border">
    <div className="container py-12 grid gap-10 md:grid-cols-4">
      <div className="md:col-span-2">
        <Link href="/" className="flex items-center gap-2.5 w-fit">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-leaf">
            <Sprout className="h-4 w-4 text-primary-foreground" />
          </span>
          <span className="font-display text-xl font-semibold">Homie</span>
        </Link>
        <p className="mt-4 text-sm text-muted-foreground max-w-sm">
          Un hogar digital para brokers y administradores que prefieren trabajar con calma.
        </p>
      </div>

      <div>
        <div className="text-sm font-medium text-foreground">Producto</div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li><Link href="/#cartera" className="hover:text-foreground">Propiedades</Link></li>
          <li><Link href="/#oportunidades" className="hover:text-foreground">Oportunidades</Link></li>
          <li><Link href="/#cuidado" className="hover:text-foreground">Documentos</Link></li>
          <li><Link href="/#finanzas" className="hover:text-foreground">Finanzas</Link></li>
        </ul>
      </div>

      <div>
        <div className="text-sm font-medium text-foreground">Homie</div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li><Link href="/sobre-nosotros" className="hover:text-foreground">Sobre nosotros</Link></li>
          <li><Link href="/privacidad" className="hover:text-foreground">Privacidad</Link></li>
          <li><Link href="/contacto" className="hover:text-foreground">Contacto</Link></li>
          <li><Link href="/catalogo" className="hover:text-foreground">Catálogo</Link></li>
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
