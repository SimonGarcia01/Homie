"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft, BedDouble, Bath, Building2, Heart, MapPin, MessageSquare, CalendarPlus,
} from "lucide-react";
import { SeekerShell } from "@/components/interesado/SeekerShell";
import { InquiryDialog } from "@/components/interesado/InquiryDialog";
import { Button } from "@/components/ui/button";
import { getPublicProperty, type PublicProperty } from "@/lib/api/public-properties";
import {
  addProspectFavorite,
  getProspectFavoriteStatus,
  removeProspectFavorite,
} from "@/lib/api/prospect-portal";
import { useProspectAuth } from "@/contexts/ProspectAuthContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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

export default function BuscarDetail() {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const { prospect } = useProspectAuth();
  const id = params.id as string;

  const [property, setProperty] = useState<PublicProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [idx, setIdx] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [inquiryType, setInquiryType] = useState<"visit" | "question">("visit");

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

  useEffect(() => {
    if (!prospect || !id) return;
    getProspectFavoriteStatus(id).then((res) => {
      if (!("error" in res)) setIsFavorite(res.isFavorite);
    });
  }, [prospect, id]);

  const images = property?.images?.length
    ? property.images.map((i) => i.imageUrl)
    : property?.coverImageUrl
      ? [property.coverImageUrl]
      : [];

  function requireAuth(action: () => void) {
    if (!prospect) {
      router.push(`/interesado/login?from=${encodeURIComponent(pathname)}`);
      return;
    }
    action();
  }

  function openInquiry(type: "visit" | "question") {
    requireAuth(() => {
      setInquiryType(type);
      setInquiryOpen(true);
    });
  }

  async function toggleFavorite() {
    requireAuth(async () => {
      setFavLoading(true);
      try {
        if (isFavorite) {
          const res = await removeProspectFavorite(id);
          if ("error" in res) throw new Error(res.error);
          setIsFavorite(false);
          toast({ title: "Eliminado de favoritos" });
        } else {
          const res = await addProspectFavorite(id);
          if ("error" in res) throw new Error(res.error);
          setIsFavorite(true);
          toast({ title: "Guardado en favoritos" });
        }
      } catch (err) {
        toast({
          title: "No se pudo actualizar",
          description: err instanceof Error ? err.message : "Intenta de nuevo.",
          variant: "destructive",
        });
      } finally {
        setFavLoading(false);
      }
    });
  }

  return (
    <SeekerShell>
      <section className="container py-10 md:py-14">
        <Link href="/buscar" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Volver a buscar
        </Link>

        {loading ? (
          <p className="text-muted-foreground">Cargando…</p>
        ) : error || !property ? (
          <div className="rounded-2xl border border-border bg-surface p-10 text-center">
            <p className="text-destructive">{error ?? "Propiedad no encontrada"}</p>
            <Button asChild variant="soft" className="mt-4">
              <Link href="/buscar">Ver propiedades</Link>
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
                      className={cn(
                        "shrink-0 h-16 w-20 rounded-lg overflow-hidden border-2",
                        idx === i ? "border-primary" : "border-border",
                      )}
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              {property.organization && (
                <p className="text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" />
                  Publicado por {property.organization.name}
                </p>
              )}
              <p className="text-xs uppercase tracking-wide text-muted-foreground mt-1">{property.code}</p>
              <h1 className="font-display text-3xl md:text-4xl font-semibold mt-1">{property.title}</h1>
              <p className="text-muted-foreground flex items-center gap-1.5 mt-2">
                <MapPin className="h-4 w-4" />
                {[property.location.address, property.location.city, property.location.country].filter(Boolean).join(", ")}
              </p>
              <p className="font-display text-3xl text-primary mt-6">{formatRent(property)}</p>
              <div className="mt-4 flex gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <BedDouble className="h-4 w-4" /> {property.feature.bedrooms} dorm.
                </span>
                <span className="inline-flex items-center gap-1">
                  <Bath className="h-4 w-4" /> {property.feature.bathrooms} baños
                </span>
              </div>
              {property.description && (
                <p className="mt-6 text-muted-foreground leading-relaxed">{property.description}</p>
              )}

              <div className="mt-8 flex flex-wrap gap-3">
                <Button variant="hero" size="lg" onClick={() => openInquiry("visit")}>
                  <CalendarPlus className="h-4 w-4" /> Quiero visitar
                </Button>
                <Button variant="soft" size="lg" onClick={() => openInquiry("question")}>
                  <MessageSquare className="h-4 w-4" /> Consultar
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => void toggleFavorite()}
                  disabled={favLoading}
                  className={cn(isFavorite && "border-primary text-primary")}
                >
                  <Heart className={cn("h-4 w-4", isFavorite && "fill-current")} />
                  {isFavorite ? "En favoritos" : "Guardar"}
                </Button>
              </div>

              {!prospect && (
                <p className="mt-4 text-sm text-muted-foreground">
                  <Link href={`/interesado/login?from=${encodeURIComponent(pathname)}`} className="text-primary hover:underline">
                    Inicia sesión
                  </Link>
                  {" "}o{" "}
                  <Link href={`/interesado/registro?from=${encodeURIComponent(pathname)}`} className="text-primary hover:underline">
                    regístrate
                  </Link>
                  {" "}para guardar favoritos y solicitar visitas.
                </p>
              )}
            </div>
          </div>
        )}
      </section>

      {property && (
        <InquiryDialog
          open={inquiryOpen}
          onOpenChange={setInquiryOpen}
          propertyId={property.id}
          propertyTitle={property.title}
          type={inquiryType}
          onCreated={() => router.push("/mi-cuenta/solicitudes")}
        />
      )}
    </SeekerShell>
  );
}
