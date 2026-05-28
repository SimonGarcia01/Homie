"use client";

import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type SpeechToTextButtonProps = {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  size?: "icon" | "sm";
  lang?: string;
};

export function SpeechToTextButton({
  value,
  onChange,
  disabled = false,
  className,
  size = "icon",
  lang,
}: SpeechToTextButtonProps) {
  const { isListening, isSupported, toggleListening } = useSpeechToText({
    lang,
    onError: (message) => {
      toast({ title: "Dictado por voz", description: message, variant: "destructive" });
    },
  });

  if (!isSupported) return null;

  return (
    <Button
      type="button"
      variant={isListening ? "default" : "ghost"}
      size={size === "sm" ? "sm" : "icon"}
      className={cn(
        size === "icon" && "h-11 w-11 shrink-0 rounded-xl",
        size === "sm" && "h-8 shrink-0 rounded-lg px-2",
        isListening && "bg-destructive text-destructive-foreground hover:bg-destructive/90 animate-pulse",
        className,
      )}
      disabled={disabled}
      onClick={() => toggleListening(() => value, onChange)}
      aria-label={isListening ? "Detener dictado" : "Dictar por voz"}
      title={isListening ? "Detener dictado" : "Dictar por voz"}
    >
      {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
    </Button>
  );
}
