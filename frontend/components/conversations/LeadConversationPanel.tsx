"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, MessageSquare, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  CHANNEL_LABELS,
  DIRECTION_LABELS,
  type MessageChannel,
  type MessageDirection,
} from "@/lib/api/inbox";
import { api } from "@/lib/mock/api";
import { buildLeadSummaryPrompt, useAssistantBridge } from "@/contexts/AssistantBridgeContext";
import { SpeechToTextButton } from "@/components/speech/SpeechToTextButton";

export type LeadConversationTarget = {
  leadId: string;
  contactName: string;
  propertyTitle?: string | null;
  opportunityId?: string;
};

function formatMessageTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function LeadConversationPanel({
  target,
  onMessageSent,
}: {
  target: LeadConversationTarget;
  onMessageSent?: () => void;
}) {
  const { openWithPrompt } = useAssistantBridge();
  const [messages, setMessages] = useState<Awaited<ReturnType<typeof api.listLeadMessages>>>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [channel, setChannel] = useState<MessageChannel>("whatsapp");
  const [direction, setDirection] = useState<MessageDirection>("outbound");
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.listLeadMessages(target.leadId);
      setMessages(rows);
    } catch (err) {
      toast({
        title: "No se pudo cargar la conversación",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [target.leadId]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const text = body.trim();
    if (!text || sending) return;

    setSending(true);
    try {
      const created = await api.createLeadMessage(target.leadId, {
        channel,
        direction,
        body: text,
        opportunityId: target.opportunityId,
      });
      setMessages((prev) => [...prev, created]);
      setBody("");
      onMessageSent?.();
      toast({ title: "Interacción registrada" });
    } catch (err) {
      toast({
        title: "No se pudo guardar",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  }

  function handleSummarize() {
    openWithPrompt(
      buildLeadSummaryPrompt({
        leadName: target.contactName,
        propertyTitle: target.propertyTitle,
      }),
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[420px]">
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="min-w-0">
          <p className="font-display font-semibold truncate">{target.contactName}</p>
          {target.propertyTitle && (
            <p className="text-xs text-muted-foreground truncate">{target.propertyTitle}</p>
          )}
        </div>
        <Button type="button" variant="soft" size="sm" onClick={handleSummarize}>
          <Sparkles className="h-3.5 w-3.5" /> Resumir con Homie
        </Button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[240px]">
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Cargando mensajes…
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            <MessageSquare className="h-6 w-6 mx-auto mb-2 opacity-60" />
            Aún no hay mensajes registrados. Anota una llamada, WhatsApp o email.
          </div>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-soft",
                m.direction === "outbound"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto bg-surface-muted border border-border",
              )}
            >
              <div className="flex items-center gap-2 text-[11px] opacity-80 mb-1">
                <span>{CHANNEL_LABELS[m.channel]}</span>
                <span>·</span>
                <span>{DIRECTION_LABELS[m.direction]}</span>
                <span>·</span>
                <span>{formatMessageTime(m.createdAt)}</span>
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{m.body}</p>
              <p className="text-[10px] opacity-70 mt-2">{m.userName}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="pt-4 border-t border-border space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground">Canal</span>
            <select
              value={channel}
              onChange={(e) => setChannel(e.target.value as MessageChannel)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {Object.entries(CHANNEL_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label className="text-xs space-y-1">
            <span className="text-muted-foreground">Dirección</span>
            <select
              value={direction}
              onChange={(e) => setDirection(e.target.value as MessageDirection)}
              className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm"
            >
              {Object.entries(DIRECTION_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex gap-2 items-start">
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Ej: Llamó por WhatsApp, quiere visitar el sábado en la mañana…"
            rows={3}
            className="resize-none flex-1"
            disabled={sending}
          />
          <SpeechToTextButton
            value={body}
            onChange={setBody}
            disabled={sending}
            className="mt-1"
          />
        </div>
        <Button type="submit" variant="hero" disabled={sending || !body.trim()} className="w-full">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Registrar interacción
        </Button>
      </form>
    </div>
  );
}
