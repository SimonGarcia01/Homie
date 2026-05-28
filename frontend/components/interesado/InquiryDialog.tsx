"use client";

import { FormEvent, useState } from "react";
import { CalendarPlus, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createProspectInquiry } from "@/lib/api/prospect-portal";
import { SpeechToTextButton } from "@/components/speech/SpeechToTextButton";
import { toast } from "@/hooks/use-toast";

export function InquiryDialog({
  open,
  onOpenChange,
  propertyId,
  propertyTitle,
  type,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  propertyTitle: string;
  type: "visit" | "question";
  onCreated?: () => void;
}) {
  const [message, setMessage] = useState("");
  const [preferredTiming, setPreferredTiming] = useState("flexible");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await createProspectInquiry({
        propertyId,
        type,
        message: message.trim() || undefined,
        preferredTiming: type === "visit" ? preferredTiming : undefined,
      });
      if ("error" in res) throw new Error(res.error);
      toast({
        title: type === "visit" ? "Solicitud enviada" : "Consulta enviada",
        description: "El broker te contactará pronto.",
      });
      onCreated?.();
      onOpenChange(false);
      setMessage("");
      setPreferredTiming("flexible");
    } catch (err) {
      toast({
        title: "No se pudo enviar",
        description: err instanceof Error ? err.message : "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  }

  const title = type === "visit" ? "Quiero visitar esta propiedad" : "Hacer una consulta";
  const Icon = type === "visit" ? CalendarPlus : MessageSquare;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground -mt-2">{propertyTitle}</p>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {type === "visit" && (
            <div className="space-y-2">
              <Label>Preferencia de visita</Label>
              <Select value={preferredTiming} onValueChange={setPreferredTiming}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_week">Esta semana</SelectItem>
                  <SelectItem value="next_week">Próxima semana</SelectItem>
                  <SelectItem value="flexible">Flexible</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="inquiry-message">Mensaje (opcional)</Label>
              <SpeechToTextButton
                value={message}
                onChange={setMessage}
                disabled={submitting}
                size="sm"
                className="h-8 rounded-lg"
              />
            </div>
            <Textarea
              id="inquiry-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === "visit"
                  ? "Ej: Prefiero visitar en la tarde…"
                  : "Ej: ¿Aceptan mascotas pequeñas?"
              }
              rows={3}
              className="resize-none"
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="hero" disabled={submitting}>
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
