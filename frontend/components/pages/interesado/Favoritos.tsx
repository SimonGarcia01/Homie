"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BedDouble, Bath, Building2, Heart, MapPin } from "lucide-react";
import { SeekerShell } from "@/components/interesado/SeekerShell";
import { Button } from "@/components/ui/button";
import { listProspectFavorites } from "@/lib/api/prospect-portal";
import type { PublicProperty } from "@/lib/api/public-properties";

function formatRent(p: PublicProperty) {
  const { monthlyRent, currency } = p.rentalDetail;
  if (currency === "CLP") {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(monthlyRent);
  }
  return `${monthlyRent} ${currency}`;
}

export default function Favoritos() {
  const [items, setItems] = useState<PublicProperty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listProspectFavorites().then((res) => {
      if (!("error" in res)) setItems(res);
      setLoading(false);
    });
  }, []);

  return (
    <SeekerShell>
      <section className="container py-10 md:py-14">
        <h1 className="font-display text-3xl font-semibold">Favoritos</h1>
        <p className="text-muted-foreground mt-1">Propiedades que guardaste para comparar.</p>

        {loading ? (
          <p className="mt-8 text-muted-foreground">Cargando…</p>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
            <Heart className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-display text-lg mt-3">Aún no tienes favoritos</p>
            <p className="text-muted-foreground text-sm mt-1">Guarda propiedades mientras exploras.</p>
            <Button asChild variant="hero" className="mt-6">
              <Link href="/buscar">Explorar propiedades</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((p) => {
              const cover = p.coverImageUrl ?? p.images[0]?.imageUrl;
              return (
                <li key={p.id}>
                  <Link
                    href={`/buscar/${p.id}`}
                    className="block rounded-2xl border border-border bg-surface overflow-hidden shadow-soft hover:shadow-card transition-all"
                  >
                    <div className="aspect-[4/3] bg-muted">
                      {cover && <img src={cover} alt={p.title} className="h-full w-full object-cover" />}
                    </div>
                    <div className="p-4">
                      <h2 className="font-display font-semibold line-clamp-1">{p.title}</h2>
                      {p.organization && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Building2 className="h-3 w-3" /> {p.organization.name}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <MapPin className="h-3.5 w-3.5" /> {p.location.city}
                      </p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="font-semibold text-primary">{formatRent(p)}</span>
                        <span className="text-xs text-muted-foreground flex gap-2">
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
    </SeekerShell>
  );
}
