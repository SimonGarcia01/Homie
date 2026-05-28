import { Suspense } from "react";
import InteresadoRegister from "@/components/pages/interesado/Register";

export default function InteresadoRegisterRoute() {
  return (
    <Suspense>
      <InteresadoRegister />
    </Suspense>
  );
}
