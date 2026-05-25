import { StaticPage } from "@/components/pages/marketing/StaticPage";

export default function PrivacidadPage() {
  return (
    <StaticPage
      title="Privacidad"
      subtitle="Cómo cuidamos la información de tu organización y de tus clientes."
    >
      <p>
        Homie almacena datos de propiedades, contactos y documentos asociados a tu organización. Solo usuarios
        autenticados de tu cuenta pueden acceder a la información operativa.
      </p>
      <p>
        No vendemos datos personales a terceros. Utilizamos conexiones seguras (HTTPS) y tokens de sesión para
        proteger el acceso a la plataforma.
      </p>
      <p>
        Si necesitas eliminar datos o exportar información de tu organización, escríbenos desde la página de contacto.
      </p>
    </StaticPage>
  );
}
