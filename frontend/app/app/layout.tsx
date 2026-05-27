"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";
import { AssistantBridgeProvider } from "@/contexts/AssistantBridgeContext";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AssistantBridgeProvider>
        {children}
        <AssistantWidget />
      </AssistantBridgeProvider>
    </ProtectedRoute>
  );
}
