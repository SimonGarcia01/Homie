"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BedDouble, Bath, MapPin } from "lucide-react";
import { MarketingShell } from "@/components/homie/MarketingShell";
import { Button } from "@/components/ui/button";
import { getPublicProperty, type PublicProperty } from "@/lib/api/public-properties";
import { getPublicPropertyGallery } from "@/lib/property-cover";

function formatRent(p: PublicProperty) {
  const { monthlyRent, currency } = p.rentalDetail;
  if (currency === "CLP") {
    return new Intl.NumberFormat("es-CL", { style: "currency", currency: "CLP", maximumFractionDigits: 0 }).format(monthlyRent);
  }
  return `${monthlyRent} ${currency}`;
}

export default function CatalogDetail() {
  const params = useParams();
  const id = params.id as string;
  const [property, setProperty] = useState<PublicProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    getPublicProperty(id).then((res) => {
      if ("error" in res) {
        setError(res.error);
      } else {
        setProperty(res);
      }
      setLoading(false);
    });
  }, [id]);

  const images = property ? getPublicPropertyGallery(property) : [];

  return (
    <MarketingShell>
      <section className="container py-10 md:py-14">
        <Link href="/catalogo" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver al catálogo
        </Link>

        {loading ? (
          <p className="text-muted-foreground">Cargando…</p>
        ) : error || !property ? (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center">
            <p className="text-destructive">{error ?? "Propiedad no encontrada"}</p>
            <Button asChild variant="soft" className="mt-4">
              <Link href="/catalogo">Ver catálogo</Link>
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-10">
            <div>
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-muted border border-border">
                {images[idx] ? (
                  <img src={images[idx]} alt={property.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full grid place-items-center text-muted-foreground">Sin imagen</div>
                )}
              </div>
              {images.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                  {images.map((url, i) => (
                    <button
                      key={url + i}
                      type="button"
                      onClick={() => setIdx(i)}
                      className={`shrink-0 h-16 w-20 rounded-lg overflow-hidden border-2 ${idx === i ? "border-primary" : "border-border"}`}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{property.code}</p>
              <h1 className="font-display text-3xl md:text-4xl font-semibold mt-1">{property.title}</h1>
              <p className="text-muted-foreground flex items-center gap-1.5 mt-2">
                <MapPin className="h-4 w-4" />
                {[property.location.address, property.location.city, property.location.country].filter(Boolean).join(", ")}
              </p>
              <p className="font-display text-3xl text-primary mt-6">{formatRent(property)}</p>
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1"><BedDouble className="h-4 w-4" /> {property.feature.bedrooms} dorm.</span>
                <span className="inline-flex items-center gap-1"><Bath className="h-4 w-4" /> {property.feature.bathrooms} baños</span>
              </div>
              {property.description && (
                <p className="mt-6 text-muted-foreground leading-relaxed">{property.description}</p>
              )}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild variant="hero" size="lg">
                  <Link href="/register">Contactar / Crear cuenta</Link>
                </Button>
                <Button asChild variant="soft" size="lg">
                  <Link href="/login">Ya tengo cuenta</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </section>
    </MarketingShell>
  );
}
