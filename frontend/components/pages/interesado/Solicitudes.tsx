"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Calendar, ClipboardList, MessageSquare } from "lucide-react";
import { SeekerShell } from "@/components/interesado/SeekerShell";
import { Button } from "@/components/ui/button";
import {
  listProspectApplications,
  listProspectInquiries,
  type ProspectApplication,
  type ProspectInquiry,
} from "@/lib/api/prospect-portal";

export default function Solicitudes() {
  const [inquiries, setInquiries] = useState<ProspectInquiry[]>([]);
  const [applications, setApplications] = useState<ProspectApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listProspectInquiries(), listProspectApplications()]).then(([inqRes, appRes]) => {
      if (!("error" in inqRes)) setInquiries(inqRes);
      if (!("error" in appRes)) setApplications(appRes);
      setLoading(false);
    });
  }, []);

  const empty = !loading && inquiries.length === 0 && applications.length === 0;

  return (
    <SeekerShell>
      <section className="container py-10 md:py-14 max-w-3xl">
        <h1 className="font-display text-3xl font-semibold">Mis solicitudes</h1>
        <p className="text-muted-foreground mt-1">Visitas, consultas y solicitudes de arriendo.</p>

        {loading ? (
          <p className="mt-8 text-muted-foreground">Cargando…</p>
        ) : empty ? (
          <div className="mt-10 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
            <Calendar className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="font-display text-lg mt-3">Sin solicitudes aún</p>
            <p className="text-muted-foreground text-sm mt-1">Cuando pidas una visita o consulta, aparecerá aquí.</p>
            <Button asChild variant="hero" className="mt-6">
              <Link href="/buscar">Buscar propiedades</Link>
            </Button>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {applications.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-medium flex items-center gap-2">
                  <ClipboardList className="h-5 w-5 text-primary" />
                  Solicitudes de arriendo
                </h2>
                <ul className="mt-4 space-y-4">
                  {applications.map((item) => {
                    const date = new Date(item.createdAt).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    return (
                      <li key={item.id} className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
                        <div className="flex flex-wrap items-center gap-2 justify-between">
                          <p className="font-medium truncate">{item.property?.title ?? "Propiedad"}</p>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/15 text-secondary shrink-0">
                            {item.statusLabel}
                          </span>
                        </div>
                        {item.organization && (
                          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                            <Building2 className="h-3.5 w-3.5" /> {item.organization.name}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{date}</p>
                        {item.property?.id && (
                          <Link
                            href={`/buscar/${item.property.id}`}
                            className="inline-block text-sm text-primary hover:underline mt-3"
                          >
                            Ver propiedad
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {inquiries.length > 0 && (
              <div>
                <h2 className="font-display text-xl font-medium flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-accent" />
                  Visitas y consultas
                </h2>
                <ul className="mt-4 space-y-4">
                  {inquiries.map((item) => {
                    const Icon = item.type === "visit" ? Calendar : MessageSquare;
                    const date = new Date(item.createdAt).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    });
                    return (
                      <li key={item.id} className="rounded-2xl border border-border bg-surface p-5 shadow-soft">
                        <div className="flex items-start gap-4">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Icon className="h-4 w-4" />
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 justify-between">
                              <p className="font-medium truncate">{item.property?.title ?? "Propiedad"}</p>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">
                                {item.statusLabel}
                              </span>
                            </div>
                            {item.organization && (
                              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                                <Building2 className="h-3.5 w-3.5" /> {item.organization.name}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">{date}</p>
                            {item.message && (
                              <p className="text-sm text-foreground/80 mt-2 line-clamp-2">{item.message}</p>
                            )}
                            {item.property?.id && (
                              <Link
                                href={`/buscar/${item.property.id}`}
                                className="inline-block text-sm text-primary hover:underline mt-3"
                              >
                                Ver propiedad
                              </Link>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </SeekerShell>
  );
}
