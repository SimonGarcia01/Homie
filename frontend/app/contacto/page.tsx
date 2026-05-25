import Link from "next/link";
import { StaticPage } from "@/components/pages/marketing/StaticPage";

export default function ContactoPage() {
  return (
    <StaticPage
      title="Contacto"
      subtitle="¿Preguntas sobre Homie? Estamos para ayudarte."
    >
      <p>
        Escríbenos a{" "}
        <a href="mailto:hola@homie.cl" className="text-primary hover:underline">
          hola@homie.cl
        </a>{" "}
        y te responderemos en un plazo de 1–2 días hábiles.
      </p>
      <p>
        Si ya tienes cuenta, también puedes{" "}
        <Link href="/login" className="text-primary hover:underline">
          iniciar sesión
        </Link>{" "}
        y gestionar tu cartera directamente.
      </p>
    </StaticPage>
  );
}
