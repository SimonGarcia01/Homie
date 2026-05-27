"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LogOut, Menu, Sprout, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useProspectAuth } from "@/contexts/ProspectAuthContext";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/buscar", label: "Buscar", icon: Home },
  { href: "/mi-cuenta/favoritos", label: "Favoritos", icon: Heart, auth: true },
  { href: "/mi-cuenta/solicitudes", label: "Solicitudes", icon: User, auth: true },
];

export function SeekerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { prospect, logout, loading } = useProspectAuth();
  const [open, setOpen] = useState(false);

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
        <div className="container flex items-center justify-between py-4 gap-4">
          <Link href="/buscar" className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-leaf shadow-soft">
              <Sprout className="h-4 w-4 text-primary-foreground" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">Homie</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(({ href, label, auth }) => {
              if (auth && !prospect && !loading) {
                return (
                  <Link
                    key={href}
                    href={`/interesado/login?from=${encodeURIComponent(href)}`}
                    className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-lg"
                  >
                    {label}
                  </Link>
                );
              }
              if (auth && !prospect) return null;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "px-3 py-2 text-sm rounded-lg transition-colors",
                    pathname === href || pathname.startsWith(href + "/")
                      ? "text-primary font-medium bg-primary/10"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {!loading && prospect ? (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href="/mi-cuenta">Hola, {prospect.firstName}</Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={() => void logout()} aria-label="Cerrar sesión">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : !loading ? (
              <>
                <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                  <Link href={`/interesado/login?from=${encodeURIComponent(pathname)}`}>Ingresar</Link>
                </Button>
                <Button asChild variant="default" size="sm" className="rounded-full">
                  <Link href={`/interesado/registro?from=${encodeURIComponent(pathname)}`}>Registrarse</Link>
                </Button>
              </>
            ) : null}

            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menú">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetHeader>
                  <SheetTitle className="font-display text-left">Buscar arriendo</SheetTitle>
                </SheetHeader>
                <nav className="mt-6 flex flex-col gap-3">
                  {NAV.map(({ href, label, auth }) => (
                    <Link
                      key={href}
                      href={auth && !prospect ? `/interesado/login?from=${encodeURIComponent(href)}` : href}
                      onClick={() => setOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {label}
                    </Link>
                  ))}
                  <hr className="border-border my-2" />
                  {prospect ? (
                    <>
                      <Link href="/mi-cuenta" onClick={() => setOpen(false)}>Mi cuenta</Link>
                      <button type="button" onClick={() => void logout()} className="text-left text-destructive">
                        Cerrar sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href={`/interesado/login?from=${encodeURIComponent(pathname)}`} onClick={() => setOpen(false)}>
                        Ingresar
                      </Link>
                      <Link
                        href={`/interesado/registro?from=${encodeURIComponent(pathname)}`}
                        onClick={() => setOpen(false)}
                        className="text-primary font-medium"
                      >
                        Registrarse
                      </Link>
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-border bg-surface mt-auto">
        <div className="container py-8 flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Homie · Encuentra tu próximo hogar.</p>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-foreground">Soy broker</Link>
            <Link href="/privacidad" className="hover:text-foreground">Privacidad</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
