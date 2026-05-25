"use client";

import { useMemo } from "react";
import { MapPin } from "lucide-react";
import type { Property } from "@/lib/mock/db";

/** Approximate city centers in Chile for map pins when lat/lng not in API yet */
const CITY_COORDS: Record<string, [number, number]> = {
  providencia: [-70.6108, -33.4372],
  santiago: [-70.6483, -33.4489],
  "las condes": [-70.5789, -33.4089],
  nunoa: [-70.5983, -33.4569],
  "la reina": [-70.5506, -33.4514],
  vitacura: [-70.5734, -33.3924],
  colina: [-70.6753, -33.2017],
  quilicura: [-70.7394, -33.3572],
};

function coordsForProperty(p: Property): [number, number] | null {
  const city = p.city?.toLowerCase().trim() ?? "";
  for (const [key, coords] of Object.entries(CITY_COORDS)) {
    if (city.includes(key)) return coords;
  }
  return [-70.6483, -33.4489];
}

export function PropertyMap({ properties }: { properties: Property[] }) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const pins = useMemo(
    () =>
      properties
        .map((p) => ({ property: p, coords: coordsForProperty(p) }))
        .filter((x): x is { property: Property; coords: [number, number] } => x.coords !== null),
    [properties],
  );

  if (!token) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-surface p-8 text-center">
        <MapPin className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
        <p className="font-medium">Mapa de propiedades</p>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          Configura <code className="text-xs">NEXT_PUBLIC_MAPBOX_TOKEN</code> para ver el mapa interactivo.
          Mientras tanto, {pins.length} propiedades geolocalizadas por comuna.
        </p>
        <ul className="mt-4 text-left text-sm space-y-2 max-w-lg mx-auto">
          {pins.slice(0, 8).map(({ property, coords }) => (
            <li key={property.id} className="flex justify-between gap-2 border-b border-border/60 pb-2">
              <span className="truncate">{property.title}</span>
              <span className="text-muted-foreground shrink-0">{property.city}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const center = pins[0]?.coords ?? [-70.6483, -33.4489];
  const markers = pins
    .map(
      ({ property, coords }) =>
        `pin-s+285A2B(${coords[0]},${coords[1]})`,
    )
    .join(",");

  const mapUrl = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/static/${markers}/${center[0]},${center[1]},11,0/800x400@2x?access_token=${token}`;

  return (
    <div className="rounded-2xl border border-border overflow-hidden shadow-soft">
      <img src={mapUrl} alt="Mapa de propiedades" className="w-full h-auto object-cover min-h-[280px]" />
      <p className="text-xs text-muted-foreground px-4 py-2 bg-surface">
        {pins.length} propiedades · centros por comuna · Mapbox
      </p>
    </div>
  );
}
