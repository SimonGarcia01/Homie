"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BedDouble, Bath, Building2, Home, ImageOff, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SeekerShell } from "@/components/interesado/SeekerShell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listPublicProperties, type PublicProperty } from "@/lib/api/public-properties";

function formatRent(p: PublicProperty) {
  const { monthlyRent, currency } = p.rentalDetail;
  if (currency === "CLP") {
    return new Intl.NumberFormat("es-CL", {
      style: "currency",
      currency: "CLP",
      maximumFractionDigits: 0,
    }).format(monthlyRent);
  }
  return `${monthlyRent} ${currency}`;
}

export default function Buscar() {
  const searchParams = useSearchParams();
  const initialQ = searchParams.get("q") ?? "";
  const [items, setItems] = useState<PublicProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(initialQ);
  const [orgFilter, setOrgFilter] = useState("__all__");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    listPublicProperties({ limit: 50, q: q.trim() || undefined }).then((res) => {
      if ("error" in res) {
        setError(res.error);
        setItems([]);
      } else {
        setError(null);
        setItems(res.data);
      }
      setLoading(false);
    });
  }, [q]);

  const organizations = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of items) {
      if (p.organization) map.set(p.organization.id, p.organization.name);
    }
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [items]);

  const filtered = useMemo(() => {
    if (orgFilter === "__all__") return items;
    return items.filter((p) => p.organization?.id === orgFilter);
  }, [items, orgFilter]);

  return (
    <SeekerShell>
      <section className="container py-10 md:py-14">
        <header className="max-w-2xl">
          <p className="text-sm text-muted-foreground">Portal de arriendos</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-1">
            Encuentra tu próximo hogar
          </h1>
          <p className="text-muted-foreground mt-3">
            Propiedades publicadas por distintos brokers. Explora sin cuenta; regístrate para guardar favoritos y pedir visitas.
          </p>
        </header>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título, comuna o dirección"
              className="pl-9 h-11"
            />
          </div>
          {organizations.length > 1 && (
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-full sm:w-[220px] h-11">
                <SelectValue placeholder="Broker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los brokers</SelectItem>
                {organizations.map(([id, name]) => (
                  <SelectItem key={id} value={id}>{name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {loading ? (
          <p className="mt-10 text-muted-foreground">Cargando propiedades…</p>
        ) : error ? (
          <div className="mt-10 rounded-2xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <p className="text-destructive">{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
            <Home className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-display text-xl mt-3">No hay propiedades disponibles</p>
            <p className="text-muted-foreground text-sm mt-1">Prueba otros filtros o vuelve más tarde.</p>
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted-foreground">{filtered.length} propiedades</p>
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((p) => {
                const cover = p.coverImageUrl ?? p.images.find((i) => i.isCover)?.imageUrl ?? p.images[0]?.imageUrl;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/buscar/${p.id}`}
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
                        {p.organization && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="h-3 w-3 shrink-0" />
                            {p.organization.name}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          {p.location.city}
                        </p>
                        <div className="mt-3 flex items-center justify-between">
                          <span className="font-semibold text-primary">{formatRent(p)}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-2">
                            <span className="inline-flex items-center gap-0.5">
                              <BedDouble className="h-3.5 w-3.5" />{p.feature.bedrooms}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <Bath className="h-3.5 w-3.5" />{p.feature.bathrooms}
                            </span>
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </SeekerShell>
  );
}
