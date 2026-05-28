"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Sprout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

const NAV_LINKS = [
  { href: "#para-arrendatarios", label: "Busco arriendo" },
  { href: "#para-brokers", label: "Soy broker" },
  { href: "#producto", label: "Features CRM" },
  { href: "#operacion", label: "Cómo funciona" },
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

        <nav className="hidden lg:flex items-center gap-7 text-sm text-muted-foreground">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle variant="pill" className="hidden md:inline-flex" />
          <ThemeToggle variant="icon" className="md:hidden" />
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link href="/buscar">Buscar arriendo</Link>
          </Button>
          <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
            <Link href="/login">Broker</Link>
          </Button>
          <Button asChild variant="default" size="sm" className="rounded-full hidden sm:inline-flex">
            <Link href="/register">Registrar broker</Link>
          </Button>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Abrir menú">
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
                <hr className="border-border my-2" />
                <div className="flex items-center justify-between gap-2 py-1">
                  <span className="text-sm text-muted-foreground">Tema</span>
                  <ThemeToggle variant="pill" />
                </div>
                <Link href="/buscar" onClick={() => setOpen(false)} className="font-medium text-accent">
                  Buscar arriendo
                </Link>
                <Link href="/interesado/login" onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                  Ingresar (arrendatario)
                </Link>
                <Link href="/login" onClick={() => setOpen(false)}>Ingresar (broker)</Link>
                <Link href="/register" onClick={() => setOpen(false)} className="font-medium text-primary">
                  Registrar broker
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
