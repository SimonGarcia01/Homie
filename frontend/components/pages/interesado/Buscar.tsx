"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { BedDouble, Bath, Building2, Home, ImageOff, MapPin, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SeekerShell } from "@/components/interesado/SeekerShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listPublicOrganizations,
  listPublicProperties,
  type PublicProperty,
} from "@/lib/api/public-properties";
import { SpeechToTextButton } from "@/components/speech/SpeechToTextButton";

type PublicOrg = { id: string; name: string; slug: string; propertyCount: number };

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
  const [organizations, setOrganizations] = useState<PublicOrg[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState(initialQ);
  const [orgFilter, setOrgFilter] = useState("__all__");
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    listPublicOrganizations().then((res) => {
      if (!("error" in res)) setOrganizations(res);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    listPublicProperties({
      limit: 50,
      q: q.trim() || undefined,
      organizationId: orgFilter === "__all__" ? undefined : orgFilter,
    }).then((res) => {
      if ("error" in res) {
        setError(res.error);
        setItems([]);
      } else {
        setError(null);
        setItems(res.data ?? []);
      }
      setLoading(false);
    });
  }, [q, orgFilter, reloadKey]);

  const orgOptions = useMemo(() => {
    if (organizations.length > 0) return organizations;
    const map = new Map<string, PublicOrg>();
    for (const p of items) {
      if (!p.organization) continue;
      map.set(p.organization.id, {
        id: p.organization.id,
        name: p.organization.name,
        slug: p.organization.slug,
        propertyCount: (map.get(p.organization.id)?.propertyCount ?? 0) + 1,
      });
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [organizations, items]);

  return (
    <SeekerShell>
      <section className="container py-10 md:py-14">
        <header className="max-w-2xl">
          <p className="text-sm text-muted-foreground">Portal de arriendos</p>
          <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-1">
            Encuentra tu próximo hogar
          </h1>
          <p className="text-muted-foreground mt-3">
            Solo aparecen propiedades <strong className="font-medium text-foreground">publicadas</strong> por
            brokers activos en Homie. Explora sin cuenta; regístrate para favoritos y visitas.
          </p>
        </header>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por título, comuna o dirección"
              className="pl-9 pr-12 h-11"
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2">
              <SpeechToTextButton
                value={q}
                onChange={setQ}
                className="h-9 w-9 rounded-lg"
              />
            </div>
          </div>
          {orgOptions.length > 0 && (
            <Select value={orgFilter} onValueChange={setOrgFilter}>
              <SelectTrigger className="w-full sm:w-[240px] h-11">
                <SelectValue placeholder="Broker" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos los brokers</SelectItem>
                {orgOptions.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name} ({org.propertyCount})
                  </SelectItem>
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
            <p className="text-sm text-muted-foreground mt-2">
              Verifica que el backend esté corriendo en el puerto configurado.
            </p>
            <Button variant="soft" className="mt-4" onClick={() => setReloadKey((k) => k + 1)}>
              Reintentar
            </Button>
          </div>
        ) : items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
            <Home className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-display text-xl mt-3">No hay propiedades publicadas</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-md mx-auto">
              {orgFilter !== "__all__"
                ? "Este broker aún no tiene arriendos visibles en el catálogo."
                : "Los brokers deben marcar sus propiedades como «Publicada» en el CRM para que aparezcan aquí."}
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="hero">
                <Link href="/login">Soy broker — publicar propiedad</Link>
              </Button>
              {orgFilter !== "__all__" && (
                <Button variant="soft" onClick={() => setOrgFilter("__all__")}>
                  Ver todos los brokers
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            <p className="mt-6 text-sm text-muted-foreground">
              {items.length} {items.length === 1 ? "propiedad" : "propiedades"}
              {orgFilter !== "__all__" && orgOptions.length > 0
                ? ` · ${orgOptions.find((o) => o.id === orgFilter)?.name ?? "Broker"}`
                : ""}
            </p>
            <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {items.map((p) => {
                const imgs = p.images ?? [];
                const cover =
                  p.coverImageUrl ?? imgs.find((i) => i.isCover)?.imageUrl ?? imgs[0]?.imageUrl;
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
                              <BedDouble className="h-3.5 w-3.5" />
                              {p.feature.bedrooms}
                            </span>
                            <span className="inline-flex items-center gap-0.5">
                              <Bath className="h-3.5 w-3.5" />
                              {p.feature.bathrooms}
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
