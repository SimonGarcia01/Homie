"use client";

import Link from "next/link";
import { Calendar, Heart, ArrowRight } from "lucide-react";
import { SeekerShell } from "@/components/interesado/SeekerShell";
import { useProspectAuth } from "@/contexts/ProspectAuthContext";

export default function MiCuenta() {
  const { prospect } = useProspectAuth();

  return (
    <SeekerShell>
      <section className="container py-10 md:py-14 max-w-2xl">
        <h1 className="font-display text-3xl font-semibold">
          Hola, {prospect?.firstName}
        </h1>
        <p className="text-muted-foreground mt-1">{prospect?.email}</p>

        <div className="mt-8 grid gap-4">
          <Link
            href="/mi-cuenta/solicitudes"
            className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-soft hover:border-primary/30 transition-colors"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Calendar className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium">Mis solicitudes</p>
              <p className="text-sm text-muted-foreground">Visitas y consultas enviadas</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          <Link
            href="/mi-cuenta/favoritos"
            className="flex items-center gap-4 rounded-2xl border border-border bg-surface p-5 shadow-soft hover:border-primary/30 transition-colors"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/15 text-accent">
              <Heart className="h-5 w-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium">Favoritos</p>
              <p className="text-sm text-muted-foreground">Propiedades que guardaste</p>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>

        <div className="mt-10">
          <Link href="/buscar" className="text-sm text-primary hover:underline">
            ← Seguir buscando propiedades
          </Link>
        </div>
      </section>
    </SeekerShell>
  );
}
