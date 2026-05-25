import PropertiesPage from "@/components/pages/app/Properties";
import { Suspense } from "react";

export default function PropertiesRoute() {
  return (
    <Suspense fallback={<p className="p-8 text-muted-foreground">Cargando…</p>}>
      <PropertiesPage />
    </Suspense>
  );
}
