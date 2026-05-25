"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, Plus, Search, MapPin, BedDouble, Bath, Ruler, ImageOff } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api, can } from "@/lib/mock/api";
import { useAuth } from "@/contexts/AuthContext";
import type { Property } from "@/lib/mock/db";
import { cn } from "@/lib/utils";
import { PropertyDetailDialog } from "@/components/properties/PropertyDetailDialog";

const STATUS_TONE: Record<Property["status"], string> = {
  disponible: "bg-primary/10 text-primary border-primary/20",
  reservada: "bg-accent/15 text-accent border-accent/20",
  arrendada: "bg-secondary/15 text-secondary border-secondary/20",
  inactiva: "bg-muted text-muted-foreground border-border",
};

const STATUS_LABEL: Record<Property["status"], string> = {
  disponible: "Disponible", reservada: "Reservada", arrendada: "Arrendada", inactiva: "Inactiva",
};

function formatRent(p: Property) {
  if (p.currency === "CLP")
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(p.rent);
  return `${p.rent} ${p.currency}`;
}

export default function Properties() {
  const { user } = useAuth();
  const [items, setItems] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todas" | Property["status"]>("todas");
  const [selected, setSelected] = useState<Property | null>(null);

  useEffect(() => {
    api.listProperties().then((p) => {
      setItems(p);
      setLoading(false);
    });
  }, []);

  const filtered = items.filter((p) => {
    if (filter !== "todas" && p.status !== filter) return false;
    if (q && !`${p.title} ${p.address} ${p.city}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });

  return (
    <AppShell>
      <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Tu jardín</p>
          <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Propiedades</h1>
          <p className="text-muted-foreground mt-1">Cada una con su propio cuidado y momento.</p>
        </div>
        {can(user?.role, "properties.create") && (
          <Button asChild variant="hero" size="lg">
            <Link href="/app/propiedades/nueva"><Plus className="h-4 w-4" /> Nueva propiedad</Link>
          </Button>
        )}
      </header>

      <div className="mt-6 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por título, dirección o comuna" className="pl-9 h-11" />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(["todas", "disponible", "reservada", "arrendada", "inactiva"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "px-4 h-11 rounded-full text-sm font-medium border transition-colors whitespace-nowrap",
                filter === s
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-surface text-foreground border-border hover:bg-surface-muted",
              )}
            >
              {s === "todas" ? "Todas" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <p className="mt-10 text-muted-foreground">Cargando…</p>
      ) : filtered.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <Home className="h-8 w-8 mx-auto text-muted-foreground" />
          <p className="font-display text-xl mt-3">Aún no hay propiedades aquí</p>
          <p className="text-muted-foreground text-sm mt-1">Cuando siembres una, aparecerá en este espacio.</p>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((p) => {
            const cover = p.images?.[0];
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => setSelected(p)}
                  className="group w-full text-left rounded-2xl border border-border bg-surface overflow-hidden shadow-soft hover:shadow-card transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    {cover ? (
                      <img
                        src={cover}
                        alt={p.title}
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                        <ImageOff className="h-8 w-8" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-foreground/40 via-transparent to-transparent" />
                    <span className={cn("absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full border backdrop-blur bg-background/85", STATUS_TONE[p.status])}>
                      {STATUS_LABEL[p.status]}
                    </span>
                    <div className="absolute bottom-3 right-3 rounded-full bg-background/90 backdrop-blur px-3 py-1 shadow-soft">
                      <p className="font-display text-sm font-semibold text-foreground">{formatRent(p)}<span className="text-[11px] text-muted-foreground font-sans">/mes</span></p>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-display text-base font-semibold leading-snug line-clamp-1">{p.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" /> {p.address}, {p.city}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-foreground/75">
                      <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" />{p.bedrooms}</span>
                      <span className="inline-flex items-center gap-1"><Bath className="h-3.5 w-3.5" />{p.bathrooms}</span>
                      <span className="inline-flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{p.surface} m²</span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <PropertyDetailDialog
        property={selected}
        open={!!selected}
        onOpenChange={(v) => !v && setSelected(null)}
      />
    </AppShell>
  );
}
