import Link from "next/link";
import { Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="relative z-20">
      <div className="container flex items-center justify-between py-6">
        <a href="#" className="flex items-center gap-2.5 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-leaf shadow-soft transition-transform group-hover:rotate-[-6deg]">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">Homie</span>
        </a>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          <a href="#producto" className="hover:text-foreground transition-colors">Producto</a>
          <a href="#cartera" className="hover:text-foreground transition-colors">Tu cartera</a>
          <a href="#operacion" className="hover:text-foreground transition-colors">Operación</a>
          <a href="#cuidado" className="hover:text-foreground transition-colors">Cuidado documental</a>
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild variant="default" size="sm" className="rounded-full">
            <Link href="/register">Crear cuenta</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};
