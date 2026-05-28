"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SpeechToTextButton } from "@/components/speech/SpeechToTextButton";
import { cn } from "@/lib/utils";

type SearchInputWithSpeechProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
};

export function SearchInputWithSpeech({
  value,
  onChange,
  placeholder = "Buscar…",
  className,
  inputClassName,
  disabled,
}: SearchInputWithSpeechProps) {
  return (
    <div className={cn("relative", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={cn("pl-9 pr-12", inputClassName)}
      />
      <div className="absolute right-1 top-1/2 -translate-y-1/2">
        <SpeechToTextButton
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="h-9 w-9 rounded-lg"
        />
      </div>
    </div>
  );
}
