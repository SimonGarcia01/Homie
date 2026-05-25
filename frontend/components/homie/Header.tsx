"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "#producto", label: "Producto" },
  { href: "#cartera", label: "Tu cartera" },
  { href: "#operacion", label: "Operación" },
  { href: "#cuidado", label: "Cuidado documental" },
];

export const Header = () => {
  const [open, setOpen] = useState(false);

  return (
    <header className="relative z-20">
      <div className="container flex items-center justify-between py-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-leaf shadow-soft transition-transform group-hover:rotate-[-6deg]">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-2xl font-semibold tracking-tight text-foreground">Homie</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
          <Button asChild variant="default" size="sm" className="rounded-full hidden sm:inline-flex">
            <Link href="/register">Crear cuenta</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(100vw-2rem,320px)]">
              <SheetHeader>
                <SheetTitle className="font-display text-left">Homie</SheetTitle>
              </SheetHeader>
              <nav className="mt-8 flex flex-col gap-4 text-base">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                ))}
                <Link href="/catalogo" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  Catálogo
                </Link>
                <hr className="border-border my-2" />
                <Link href="/login" onClick={() => setOpen(false)}>Iniciar sesión</Link>
                <Link href="/register" onClick={() => setOpen(false)} className="font-medium text-primary">
                  Crear cuenta
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
