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
          Plataforma multi-broker: busca arriendo como arrendatario o gestiona tu cartera como broker.
        </p>
      </div>

      <div>
        <div className="text-sm font-medium text-foreground">Busco arriendo</div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li><Link href="/buscar" className="hover:text-foreground">Explorar propiedades</Link></li>
          <li><Link href="/interesado/registro" className="hover:text-foreground">Crear cuenta</Link></li>
          <li><Link href="/mi-cuenta/favoritos" className="hover:text-foreground">Mis favoritos</Link></li>
          <li><Link href="/mi-cuenta/solicitudes" className="hover:text-foreground">Mis solicitudes</Link></li>
        </ul>
      </div>

      <div>
        <div className="text-sm font-medium text-foreground">Brokers</div>
        <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
          <li><Link href="/login" className="hover:text-foreground">Ingresar al CRM</Link></li>
          <li><Link href="/register" className="hover:text-foreground">Registrar broker</Link></li>
          <li><Link href="/#producto" className="hover:text-foreground">Features</Link></li>
          <li><Link href="/sobre-nosotros" className="hover:text-foreground">Sobre nosotros</Link></li>
          <li><Link href="/contacto" className="hover:text-foreground">Contacto</Link></li>
          <li><Link href="/privacidad" className="hover:text-foreground">Privacidad</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border">
      <div className="container py-5 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between gap-2">
        <span>© {new Date().getFullYear()} Homie · Hecho con cuidado.</span>
        <span>Arrendatarios y brokers, en un mismo hogar digital.</span>
      </div>
    </div>
  </footer>
);
