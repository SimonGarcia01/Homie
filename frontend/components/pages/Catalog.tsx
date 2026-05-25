"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BedDouble, Bath, Home, ImageOff, MapPin, Search } from "lucide-react";
import { MarketingShell } from "@/components/homie/MarketingShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { listPublicProperties, type PublicProperty } from "@/lib/api/public-properties";

function formatRent(p: PublicProperty) {
  const { monthlyRent, currency } = p.rentalDetail;
  if (currency === "CLP") {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(monthlyRent);
  }
  return `${monthlyRent} ${currency}`;
}

export default function Catalog() {
  const [items, setItems] = useState<PublicProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listPublicProperties({ limit: 50 }).then((res) => {
      if ("error" in res) {
        setError(res.error);
        setLoading(false);
        return;
      }
      setItems(res.data);
      setLoading(false);
    });
  }, []);

  const filtered = items.filter((p) => {
    if (!q) return true;
    const hay = `${p.title} ${p.location.city} ${p.location.address ?? ""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <MarketingShell>
      <section className="container py-12 md:py-16">
        <header className="max-w-2xl">
          <p className="text-sm text-muted-foreground">Catálogo público</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-1">
            Propiedades disponibles
          </h1>
          <p className="text-muted-foreground mt-3">
            Explora arriendos publicados. Para gestionar tu cartera,{" "}
            <Link href="/login" className="text-primary hover:underline">inicia sesión</Link>.
          </p>
        </header>

        <div className="mt-8 relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título, comuna o dirección"
            className="pl-9 h-11"
          />
        </div>

        {loading ? (
          <p className="mt-10 text-muted-foreground">Cargando catálogo…</p>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="text-destructive">{error}</p>
            <p className="text-sm text-muted-foreground mt-2">Asegúrate de que el backend esté corriendo.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
            <Home className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-display text-xl mt-3">No hay propiedades publicadas</p>
            <p className="text-muted-foreground text-sm mt-1">Vuelve pronto o crea una cuenta para publicar la tuya.</p>
            <Button asChild variant="hero" className="mt-6">
              <Link href="/register">Crear cuenta</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p) => {
              const cover = p.coverImageUrl ?? p.images.find((i) => i.isCover)?.imageUrl ?? p.images[0]?.imageUrl;
              return (
                <li key={p.id}>
                  <Link
                    href={`/catalogo/${p.id}`}
                    className="group block rounded-2xl border border-border bg-surface overflow-hidden shadow-soft hover:shadow-card transition-all hover:-translate-y-0.5"
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
                    </div>
                    <div className="p-4">
                      <h2 className="font-display text-lg font-semibold line-clamp-1">{p.title}</h2>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {p.location.city}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-semibold text-primary">{formatRent(p)}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-2">
                          <span className="inline-flex items-center gap-0.5"><BedDouble className="h-3.5 w-3.5" />{p.feature.bedrooms}</span>
                          <span className="inline-flex items-center gap-0.5"><Bath className="h-3.5 w-3.5" />{p.feature.bathrooms}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </MarketingShell>
  );
}
