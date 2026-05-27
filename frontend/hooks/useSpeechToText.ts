"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type UseSpeechToTextOptions = {
  lang?: string;
  continuous?: boolean;
  onError?: (message: string) => void;
};

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

function errorMessage(code: string): string {
  switch (code) {
    case "not-allowed":
    case "service-not-allowed":
      return "Permiso de micrófono denegado. Habilítalo en el navegador.";
    case "no-speech":
      return "No se detectó voz. Intenta de nuevo.";
    case "audio-capture":
      return "No se encontró un micrófono disponible.";
    case "network":
      return "Se requiere conexión para reconocimiento de voz.";
    default:
      return "No se pudo usar dictado por voz.";
  }
}

export function useSpeechToText(options: UseSpeechToTextOptions = {}) {
  const { lang = "es-CL", continuous = false, onError } = options;
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const committedRef = useRef("");
  const getValueRef = useRef<(() => string) | null>(null);
  const onUpdateRef = useRef<((value: string) => void) | null>(null);

  useEffect(() => {
    setIsSupported(!!getSpeechRecognitionCtor());
    return () => {
      recognitionRef.current?.abort();
    };
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (getValue: () => string, onUpdate: (value: string) => void) => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        onError?.("Tu navegador no soporta dictado por voz. Prueba Chrome o Edge.");
        return;
      }

      if (isListening) {
        stopListening();
        return;
      }

      getValueRef.current = getValue;
      onUpdateRef.current = onUpdate;
      committedRef.current = getValue().trimEnd();

      const recognition = new Ctor();
      recognition.lang = lang;
      recognition.continuous = continuous;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let interim = "";
        let finalChunk = "";

        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) finalChunk += transcript;
          else interim += transcript;
        }

        const base = committedRef.current;
        const spacer = base && (finalChunk || interim) ? " " : "";
        const merged = `${base}${spacer}${finalChunk || interim}`.trimStart();

        if (finalChunk) {
          committedRef.current = merged;
        }

        onUpdateRef.current?.(merged);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error !== "aborted") {
          onError?.(errorMessage(event.error));
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      recognitionRef.current = recognition;
      setIsListening(true);

      try {
        recognition.start();
      } catch {
        setIsListening(false);
        onError?.("No se pudo iniciar el micrófono.");
      }
    },
    [continuous, isListening, lang, onError, stopListening],
  );

  const toggleListening = useCallback(
    (getValue: () => string, onUpdate: (value: string) => void) => {
      if (isListening) stopListening();
      else startListening(getValue, onUpdate);
    },
    [isListening, startListening, stopListening],
  );

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    toggleListening,
  };
}
