"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

type AssistantBridgeContextValue = {
  pendingPrompt: string | null;
  openWithPrompt: (prompt: string) => void;
  consumePrompt: () => string | null;
  isOpenRequest: boolean;
  requestOpen: () => void;
  consumeOpenRequest: () => void;
};

const AssistantBridgeContext = createContext<AssistantBridgeContextValue | null>(null);

export function AssistantBridgeProvider({ children }: { children: ReactNode }) {
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [isOpenRequest, setIsOpenRequest] = useState(false);

  const openWithPrompt = useCallback((prompt: string) => {
    setPendingPrompt(prompt);
    setIsOpenRequest(true);
  }, []);

  const consumePrompt = useCallback(() => {
    const value = pendingPrompt;
    setPendingPrompt(null);
    return value;
  }, [pendingPrompt]);

  const requestOpen = useCallback(() => setIsOpenRequest(true), []);

  const consumeOpenRequest = useCallback(() => {
    if (!isOpenRequest) return;
    setIsOpenRequest(false);
  }, [isOpenRequest]);

  const value = useMemo(
    () => ({
      pendingPrompt,
      openWithPrompt,
      consumePrompt,
      isOpenRequest,
      requestOpen,
      consumeOpenRequest,
    }),
    [pendingPrompt, openWithPrompt, consumePrompt, isOpenRequest, requestOpen, consumeOpenRequest],
  );

  return <AssistantBridgeContext.Provider value={value}>{children}</AssistantBridgeContext.Provider>;
}

export function useAssistantBridge() {
  const ctx = useContext(AssistantBridgeContext);
  if (!ctx) throw new Error("useAssistantBridge must be used within AssistantBridgeProvider");
  return ctx;
}

export function buildLeadSummaryPrompt(input: {
  leadName: string;
  propertyTitle?: string | null;
}) {
  const propertyPart = input.propertyTitle ? ` sobre ${input.propertyTitle}` : "";
  return `Resume el hilo de conversación con ${input.leadName}${propertyPart}: puntos clave, interés, objeciones y próximo paso sugerido.`;
}
