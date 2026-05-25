"use client";

import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AssistantWidget } from "@/components/assistant/AssistantWidget";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      {children}
      <AssistantWidget />
    </ProtectedRoute>
  );
}
