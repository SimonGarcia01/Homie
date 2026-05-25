"use client";

import { useCallback, useRef, useState } from "react";
import { MessageSquare, RotateCcw, Send, Sparkles, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import {
  getAssistantSessionId,
  resetAssistantSessionId,
  sendAssistantMessage,
  type AssistantChatMessage,
  type AssistantPropertyPreview,
} from "@/lib/api/assistant";
import { translateAuthError } from "@/lib/auth-messages";
import { AssistantMessageBubble } from "@/components/assistant/AssistantMessageBubble";

const SUGGESTIONS = [
  "¿Cuántas casas disponibles tengo?",
  "Resumen del portafolio",
  "Agrega un depto en Providencia, 850 mil, de María González",
];

function isApiError(value: unknown): value is { error: string; status?: number } {
  return typeof value === "object" && value !== null && "error" in value;
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<AssistantChatMessage[]>([]);
  const [sessionId, setSessionId] = useState(() => getAssistantSessionId());
  const [pendingPreview, setPendingPreview] = useState<AssistantPropertyPreview | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const startNewConversation = useCallback(() => {
    const nextSession = resetAssistantSessionId();
    setSessionId(nextSession);
    setMessages([]);
    setPendingPreview(null);
    setInput("");
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;

      const userMsg: AssistantChatMessage = { role: "user", content: trimmed };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);
      scrollToBottom();

      try {
        const result = await sendAssistantMessage({ sessionId, message: trimmed });
        if (isApiError(result)) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: translateAuthError(result.error, result.status) },
          ]);
        } else {
          setSessionId(result.sessionId);
          if (result.preview) setPendingPreview(result.preview);
          else if (result.toolsUsed?.includes("confirmar_crear_propiedad")) setPendingPreview(null);

          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: result.message,
              preview: result.preview ?? undefined,
            },
          ]);
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "No pude consultar tu portafolio. Intenta de nuevo." },
        ]);
      } finally {
        setLoading(false);
        scrollToBottom();
      }
    },
    [loading, scrollToBottom, sessionId],
  );

  return (
    <>
      <Button
        type="button"
        variant="hero"
        size="icon"
        className="fixed bottom-6 right-6 z-[55] h-14 w-14 rounded-full shadow-leaf lg:bottom-8 lg:right-8"
        onClick={() => setOpen(true)}
        aria-label="Abrir asistente Homie"
      >
        <MessageSquare className="h-6 w-6" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
          <SheetHeader className="border-b border-border px-5 py-4 text-left">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <SheetTitle className="font-display text-lg">Asistente Homie</SheetTitle>
                  <p className="text-xs text-muted-foreground">Consultas sobre tu portafolio</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={startNewConversation}
                  aria-label="Nueva conversación"
                  title="Nueva conversación"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </SheetHeader>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4">
            <div className="space-y-4 py-4">
              {messages.length === 0 && (
                <div className="rounded-2xl border border-border bg-surface-muted/60 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Hola, soy tu asistente de propiedades.</p>
                  <p className="mt-1">Pregúntame cuántas propiedades tienes, filtros por ciudad, arriendos y más.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground transition hover:bg-surface-muted"
                        onClick={() => sendMessage(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg, i) => (
                <AssistantMessageBubble key={`${msg.role}-${i}`} msg={msg} />
              ))}

              {pendingPreview && !loading && (
                <div className="flex justify-start">
                  <button
                    type="button"
                    className="rounded-full border border-primary bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition hover:bg-primary/20"
                    onClick={() => sendMessage("Sí, créala")}
                  >
                    Sí, créala
                  </button>
                </div>
              )}

              {loading && (
                <div className="flex gap-2">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  </div>
                  <div className="rounded-2xl rounded-tl-md border border-border bg-surface px-4 py-3 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.2s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.1s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
                    </span>
                    <span className="ml-2">Consultando tu portafolio…</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border p-4">
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage(input);
              }}
            >
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregunta sobre tus propiedades…"
                className="min-h-[44px] max-h-28 resize-none rounded-xl"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void sendMessage(input);
                  }
                }}
                disabled={loading}
              />
              <Button type="submit" variant="hero" size="icon" className="h-11 w-11 shrink-0 rounded-xl" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
