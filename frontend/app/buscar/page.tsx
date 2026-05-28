import { Suspense } from "react";
import BuscarPage from "@/components/pages/interesado/Buscar";

export default function BuscarRoute() {
  return (
    <Suspense>
      <BuscarPage />
    </Suspense>
  );
}
