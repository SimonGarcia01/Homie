export type DemoLoginAccount = {
  id: string;
  roleLabel: string;
  description: string;
  email: string;
  password: string;
};

/** Cuentas demo del seed (`npm run seed` en backend). */
export const DEMO_LOGIN_ACCOUNTS: DemoLoginAccount[] = [
  {
    id: "admin",
    roleLabel: "Administrador",
    description: "Usuarios, propiedades, finanzas y reportes.",
    email: "admin@boho.test",
    password: "Admin1234!",
  },
  {
    id: "coordinador",
    roleLabel: "Coordinador",
    description: "Pipeline, finanzas y supervisión del equipo.",
    email: "coord@boho.test",
    password: "Coord1234!",
  },
  {
    id: "agente",
    roleLabel: "Agente",
    description: "Leads, visitas, propiedades e inbox.",
    email: "agent@boho.test",
    password: "Agent1234!",
  },
];
