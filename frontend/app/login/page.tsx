import { Suspense } from "react";
import LoginPage from "@/components/pages/Login";

function LoginFallback() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
      <p className="text-muted-foreground">Cargando…</p>
    </main>
  );
}

export default function LoginRoute() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginPage />
    </Suspense>
  );
}
