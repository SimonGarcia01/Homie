"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Home,
  LayoutDashboard,
  Leaf,
  Loader2,
  Search,
  Sprout,
  UserPlus,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { api } from "@/lib/mock/api";
import type { Lead, Property, Visit } from "@/lib/mock/db";
import { SpeechToTextButton } from "@/components/speech/SpeechToTextButton";

type NavItem = { label: string; href: string; icon: typeof Home };

const NAV_ITEMS: NavItem[] = [
  { label: "Inicio", href: "/app", icon: LayoutDashboard },
  { label: "Propiedades", href: "/app/propiedades", icon: Home },
  { label: "Leads", href: "/app/leads", icon: UserPlus },
  { label: "Oportunidades", href: "/app/oportunidades", icon: Leaf },
  { label: "Visitas", href: "/app/visitas", icon: Calendar },
  { label: "Propietarios", href: "/app/propietarios", icon: Sprout },
  { label: "Mi perfil", href: "/app/perfil", icon: UserPlus },
];

function matchesQuery(text: string, query: string) {
  return text.toLowerCase().includes(query.toLowerCase());
}

export function GlobalSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [visits, setVisits] = useState<(Visit & { property?: Property; lead?: Lead })[]>([]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    setLoading(true);
    Promise.all([api.listProperties(), api.listLeads(), api.getUpcomingVisits()])
      .then(([props, leadRows, visitRows]) => {
        setProperties(props);
        setLeads(leadRows);
        setVisits(visitRows);
      })
      .finally(() => setLoading(false));
  }, [open]);

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router],
  );

  const filteredNav = useMemo(() => {
    if (!query.trim()) return NAV_ITEMS;
    return NAV_ITEMS.filter((item) => matchesQuery(item.label, query));
  }, [query]);

  const filteredProperties = useMemo(() => {
    if (!query.trim()) return properties.slice(0, 8);
    return properties.filter((p) => matchesQuery(`${p.title} ${p.address} ${p.city}`, query)).slice(0, 8);
  }, [properties, query]);

  const filteredLeads = useMemo(() => {
    if (!query.trim()) return leads.slice(0, 8);
    return leads.filter((l) => matchesQuery(`${l.name} ${l.email} ${l.phone}`, query)).slice(0, 8);
  }, [leads, query]);

  const filteredVisits = useMemo(() => {
    if (!query.trim()) return visits.slice(0, 6);
    return visits
      .filter((v) =>
        matchesQuery(`${v.lead?.name ?? ""} ${v.property?.title ?? ""}`, query),
      )
      .slice(0, 6);
  }, [visits, query]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Buscar en Homie">
      <div className="relative border-b">
        <CommandInput
          placeholder="Buscar propiedades, leads, visitas…"
          value={query}
          onValueChange={setQuery}
          className="pr-12"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 z-10">
          <SpeechToTextButton
            value={query}
            onChange={setQuery}
            className="h-8 w-8 rounded-lg"
          />
        </div>
      </div>
      <CommandList>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando…
          </div>
        ) : (
          <>
            <CommandEmpty>Sin resultados.</CommandEmpty>

            {filteredNav.length > 0 && (
              <CommandGroup heading="Navegación">
                {filteredNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem key={item.href} value={`nav-${item.label}`} onSelect={() => go(item.href)}>
                      <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {filteredProperties.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Propiedades">
                  {filteredProperties.map((p) => (
                    <CommandItem key={p.id} value={`property-${p.title}-${p.id}`} onSelect={() => go("/app/propiedades")}>
                      <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{p.title}</span>
                      <span className="ml-auto text-xs text-muted-foreground truncate max-w-[140px]">{p.city}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {filteredLeads.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Leads">
                  {filteredLeads.map((l) => (
                    <CommandItem key={l.id} value={`lead-${l.name}-${l.id}`} onSelect={() => go("/app/leads")}>
                      <Sprout className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{l.name}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{l.stage}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {filteredVisits.length > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup heading="Visitas">
                  {filteredVisits.map((v) => (
                    <CommandItem key={v.id} value={`visit-${v.id}`} onSelect={() => go("/app/visitas")}>
                      <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                      <span className="truncate">{v.lead?.name ?? "Visita"}</span>
                      <span className="ml-auto text-xs text-muted-foreground">
                        {new Date(v.date).toLocaleString("es-CL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}

export function GlobalSearchTrigger({
  className,
  onClick,
}: {
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label="Buscar"
    >
      <Search className="h-4 w-4 text-muted-foreground" />
      <span className="hidden sm:inline text-sm text-muted-foreground">Buscar…</span>
      <kbd className="hidden md:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
        ⌘K
      </kbd>
    </button>
  );
}
