import { Suspense } from "react";
import InteresadoLogin from "@/components/pages/interesado/Login";

export default function InteresadoLoginRoute() {
  return (
    <Suspense>
      <InteresadoLogin />
    </Suspense>
  );
}
