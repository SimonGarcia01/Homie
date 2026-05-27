"use client";

import { ProspectProtectedRoute } from "@/components/auth/ProspectProtectedRoute";

export default function MiCuentaLayout({ children }: { children: React.ReactNode }) {
  return <ProspectProtectedRoute>{children}</ProspectProtectedRoute>;
}
