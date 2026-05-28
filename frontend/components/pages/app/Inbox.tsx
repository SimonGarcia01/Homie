"use client";

import { useCallback, useEffect, useState } from "react";
import { Inbox, MessageSquare } from "lucide-react";
import { SearchInputWithSpeech } from "@/components/speech/SearchInputWithSpeech";
import { AppShell } from "@/components/app/AppShell";
import { Skeleton } from "@/components/ui/skeleton";
import { CHANNEL_LABELS, DIRECTION_LABELS, type InboxThread } from "@/lib/api/inbox";
import { api } from "@/lib/mock/api";
import { cn } from "@/lib/utils";
import { LeadConversationPanel, type LeadConversationTarget } from "@/components/conversations/LeadConversationPanel";

function formatRelative(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMin < 60) return `Hace ${Math.max(diffMin, 1)} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  return new Intl.DateTimeFormat("es-CL", { day: "numeric", month: "short" }).format(date);
}

export default function InboxPage() {
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<LeadConversationTarget | null>(null);

  const refresh = useCallback(() => {
    return api.listInboxThreads().then((rows) => {
      setThreads(rows);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filtered = threads.filter((t) => {
    if (!q) return true;
    const hay = `${t.contactName} ${t.email} ${t.phone} ${t.propertyTitle ?? ""} ${t.lastMessage}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  return (
    <AppShell>
      <header>
        <p className="text-sm text-muted-foreground">Comunicaciones</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground mt-1">Registra WhatsApp, llamadas y emails por interesado.</p>
      </header>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 min-h-[620px]">
        <section className="rounded-2xl border border-border bg-surface shadow-soft overflow-hidden flex flex-col">
          <div className="p-4 border-b border-border">
            <SearchInputWithSpeech
              value={q}
              onChange={setQ}
              placeholder="Buscar contacto o mensaje"
              inputClassName="h-10"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-3 opacity-60" />
                {threads.length === 0
                  ? "Aún no hay conversaciones. Registra la primera desde Leads u Oportunidades."
                  : "No hay resultados para tu búsqueda."}
              </div>
            ) : (
              <ul>
                {filtered.map((thread) => {
                  const active = selected?.leadId === thread.leadId;
                  return (
                    <li key={thread.leadId}>
                      <button
                        type="button"
                        onClick={() =>
                          setSelected({
                            leadId: thread.leadId,
                            contactName: thread.contactName,
                            propertyTitle: thread.propertyTitle,
                          })
                        }
                        className={cn(
                          "w-full text-left px-4 py-4 border-b border-border transition hover:bg-surface-muted/60",
                          active && "bg-primary/5 border-l-2 border-l-primary",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm truncate">{thread.contactName}</p>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatRelative(thread.lastMessageAt)}
                          </span>
                        </div>
                        {thread.propertyTitle && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{thread.propertyTitle}</p>
                        )}
                        <p className="text-xs text-foreground/75 line-clamp-2 mt-1">{thread.lastMessage}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          {CHANNEL_LABELS[thread.lastChannel]} · {DIRECTION_LABELS[thread.lastDirection]} · {thread.messageCount} msgs
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface shadow-soft p-5 min-h-[420px]">
          {selected ? (
            <LeadConversationPanel
              target={selected}
              onMessageSent={() => void refresh()}
            />
          ) : (
            <div className="h-full min-h-[420px] grid place-items-center text-center text-muted-foreground p-8">
              <MessageSquare className="h-10 w-10 mb-3 opacity-50" />
              <p className="font-display text-lg text-foreground">Selecciona una conversación</p>
              <p className="text-sm mt-1 max-w-sm">
                O abre un lead en Semillero / Oportunidades y pulsa &quot;Conversación&quot;.
              </p>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
