// Mock in-memory database for Homie. Replace with Lovable Cloud calls later.
export type Role = "admin" | "coordinador" | "agente" | "broker";

export type User = {
  id: string;
  name: string;
  email: string;
  password: string; // mock only
  role: Role;
  active: boolean;
  avatarColor: string;
};

export type PropertyStatus = "disponible" | "reservada" | "arrendada" | "inactiva";
export type PublishStatus = "publicada" | "borrador" | "pausada";
export type PropertyType = "departamento" | "casa" | "oficina" | "local" | "bodega";

export type Owner = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

export type Property = {
  id: string;
  title: string;
  description: string;
  type: PropertyType;
  address: string;
  city: string;
  rent: number;
  currency: "CLP" | "UF" | "USD";
  status: PropertyStatus;
  publishStatus: PublishStatus;
  bedrooms: number;
  bathrooms: number;
  surface: number;
  ownerId: string;
  agentId: string;
  createdAt: string;
  images?: string[];
  amenities?: string[];
};

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  stage: "nuevo" | "contactado" | "visita" | "aplicacion" | "ganado" | "perdido";
  createdAt: string;
};

export type Opportunity = {
  id: string;
  leadId: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  stage: Lead["stage"];
  createdAt: string;
  property?: Property;
};

export type Visit = {
  id: string;
  propertyId: string;
  leadId: string;
  date: string;
  status: "programada" | "realizada" | "cancelada";
  notes?: string;
  durationMin?: number;
};

export type Document = {
  id: string;
  name: string;
  kind: "contrato" | "cedula" | "comprobante" | "garantia" | "otro";
  status: "pendiente" | "verificado" | "rechazado" | "vencido";
  propertyId?: string;
  leadId?: string;
  ownerId?: string;
  uploadedAt: string;
  expiresAt?: string;
  size: string;
};

export type Activity = {
  id: string;
  type: "propiedad" | "lead" | "visita" | "documento" | "contrato" | "oportunidad";
  message: string;
  userId: string;
  entityId: string;
  entityLabel: string;
  date: string;
};

export type Finance = {
  id: string;
  kind: "ingreso" | "gasto";
  concept: string;
  amount: number;
  date: string;
  propertyId?: string;
};

const now = new Date();
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString();

export const users: User[] = [
  { id: "u1", name: "Camila Rivas", email: "admin@homie.cl", password: "homie123", role: "admin", active: true, avatarColor: "primary" },
  { id: "u2", name: "Diego Soto", email: "coord@homie.cl", password: "homie123", role: "coordinador", active: true, avatarColor: "accent" },
  { id: "u3", name: "Valentina Cruz", email: "agente@homie.cl", password: "homie123", role: "agente", active: true, avatarColor: "secondary" },
  { id: "u4", name: "Tomás Herrera", email: "broker@homie.cl", password: "homie123", role: "broker", active: true, avatarColor: "primary" },
  { id: "u5", name: "Ignacia Pérez", email: "ignacia@homie.cl", password: "homie123", role: "agente", active: false, avatarColor: "secondary" },
];

export const owners: Owner[] = [
  { id: "o1", name: "Familia Vergara", email: "vergara@mail.cl", phone: "+56 9 1234 5678" },
  { id: "o2", name: "María Elena Soto", email: "msoto@mail.cl", phone: "+56 9 8765 4321" },
  { id: "o3", name: "Inversiones Roble SpA", email: "contacto@roble.cl", phone: "+56 2 2345 6789" },
  { id: "o4", name: "Patricio Lagos", email: "plagos@mail.cl", phone: "+56 9 5555 1212" },
];

const img = (id: string, ...keys: string[]) => keys.map((k) => `https://images.unsplash.com/${k}?auto=format&fit=crop&w=1400&q=80`);

export const properties: Property[] = [
  { id: "p1", title: "Departamento luminoso en Providencia", description: "Lleno de luz natural, balcón con vista a los cerros. Cocina abierta, piso de madera y ventanales de piso a techo que enmarcan la cordillera al amanecer.", type: "departamento", address: "Av. Pedro de Valdivia 1234", city: "Providencia", rent: 650000, currency: "CLP", status: "disponible", publishStatus: "publicada", bedrooms: 2, bathrooms: 2, surface: 68, ownerId: "o1", agentId: "u3", createdAt: daysAgo(2), images: img("p1","photo-1502672260266-1c1ef2d93688","photo-1505691938895-1758d7feb511","photo-1493809842364-78817add7ffb","photo-1484154218962-a197022b5858"), amenities: ["Balcón","Estacionamiento","Bodega","Conserje 24/7","Gimnasio"] },
  { id: "p2", title: "Casa con jardín en Ñuñoa", description: "Casa familiar con patio amplio y árboles frutales. Living comedor con chimenea, quincho techado y dos plantas con vista al jardín.", type: "casa", address: "Calle Los Robles 456", city: "Ñuñoa", rent: 28, currency: "UF", status: "reservada", publishStatus: "publicada", bedrooms: 4, bathrooms: 3, surface: 180, ownerId: "o2", agentId: "u4", createdAt: daysAgo(7), images: img("p2","photo-1568605114967-8130f3a36994","photo-1600585154340-be6161a56a0c","photo-1600566753190-17f0baa2a6c3","photo-1583847268964-b28dc8f51f92"), amenities: ["Jardín","Quincho","Chimenea","2 Estacionamientos"] },
  { id: "p3", title: "Loft en Bellas Artes", description: "Espacio diáfano, perfecto para profesional creativo. Doble altura, muros de ladrillo a la vista y mucha luz natural.", type: "departamento", address: "Merced 789", city: "Santiago", rent: 480000, currency: "CLP", status: "arrendada", publishStatus: "pausada", bedrooms: 1, bathrooms: 1, surface: 45, ownerId: "o3", agentId: "u3", createdAt: daysAgo(40), images: img("p3","photo-1522708323590-d24dbb6b0267","photo-1560448204-e02f11c3d0e2","photo-1536376072261-38c75010e6c9"), amenities: ["Doble altura","Amoblado","Cerca metro"] },
  { id: "p4", title: "Oficina en Las Condes", description: "Oficina premium en torre corporativa. Vista panorámica, salas de reunión y acceso a coworking del edificio.", type: "oficina", address: "Apoquindo 5500", city: "Las Condes", rent: 35, currency: "UF", status: "disponible", publishStatus: "publicada", bedrooms: 0, bathrooms: 2, surface: 120, ownerId: "o3", agentId: "u4", createdAt: daysAgo(12), images: img("p4","photo-1497366216548-37526070297c","photo-1497366754035-f200968a6e72","photo-1505691938895-1758d7feb511"), amenities: ["Vista panorámica","Recepción","3 Estacionamientos","Salas de reunión"] },
  { id: "p5", title: "Departamento en Lastarria", description: "Edificio histórico restaurado, terminaciones cálidas. Cocina italiana, piso de roble y un balcón con plantas que mira al barrio.", type: "departamento", address: "José Victorino Lastarria 70", city: "Santiago", rent: 720000, currency: "CLP", status: "disponible", publishStatus: "publicada", bedrooms: 2, bathrooms: 1, surface: 72, ownerId: "o4", agentId: "u3", createdAt: daysAgo(1), images: img("p5","photo-1493809842364-78817add7ffb","photo-1556909114-f6e7ad7d3136","photo-1502005229762-cf1b2da7c5d6","photo-1513694203232-719a280e022f"), amenities: ["Edificio patrimonial","Balcón","Cocina equipada","Bodega"] },
  { id: "p6", title: "Casa con piscina en Chicureo", description: "Casa amplia en condominio, piscina compartida. Cinco dormitorios, family room y un patio para crecer.", type: "casa", address: "Camino Chicureo 2200", city: "Colina", rent: 45, currency: "UF", status: "disponible", publishStatus: "borrador", bedrooms: 5, bathrooms: 4, surface: 240, ownerId: "o1", agentId: "u4", createdAt: daysAgo(20), images: img("p6","photo-1564013799919-ab600027ffc6","photo-1613490493576-7fde63acd811","photo-1600596542815-ffad4c1539a9"), amenities: ["Piscina","Condominio","Áreas verdes","2 Estacionamientos"] },
  { id: "p7", title: "Estudio en Barrio Italia", description: "Estudio acogedor cerca de cafés y tiendas. Diseño cálido, listo para entrar a vivir.", type: "departamento", address: "Italia 1100", city: "Providencia", rent: 380000, currency: "CLP", status: "arrendada", publishStatus: "pausada", bedrooms: 1, bathrooms: 1, surface: 32, ownerId: "o2", agentId: "u3", createdAt: daysAgo(60), images: img("p7","photo-1522708323590-d24dbb6b0267","photo-1560448204-e02f11c3d0e2"), amenities: ["Amoblado","Cerca metro"] },
  { id: "p8", title: "Local comercial en Vitacura", description: "Local en boulevard, alta visibilidad. Vitrinas amplias y flujo peatonal constante.", type: "local", address: "Av. Vitacura 3800", city: "Vitacura", rent: 60, currency: "UF", status: "inactiva", publishStatus: "pausada", bedrooms: 0, bathrooms: 1, surface: 90, ownerId: "o3", agentId: "u4", createdAt: daysAgo(90), images: img("p8","photo-1441986300917-64674bd600d8","photo-1521335629791-ce4aec67dd47"), amenities: ["Alta visibilidad","Vitrina","Bodega"] },
  { id: "p9", title: "Departamento familiar en La Reina", description: "Cómodo, cerca de parques y colegios. Tres dormitorios, logia y vista cordillera.", type: "departamento", address: "Av. Larraín 9000", city: "La Reina", rent: 550000, currency: "CLP", status: "disponible", publishStatus: "publicada", bedrooms: 3, bathrooms: 2, surface: 95, ownerId: "o4", agentId: "u3", createdAt: daysAgo(5), images: img("p9","photo-1484154218962-a197022b5858","photo-1502005229762-cf1b2da7c5d6","photo-1556909114-f6e7ad7d3136"), amenities: ["Vista cordillera","Logia","Estacionamiento","Bodega"] },
  { id: "p10", title: "Bodega en Quilicura", description: "Bodega industrial, fácil acceso camiones. Altura 8m, andén de carga y oficinas.", type: "bodega", address: "Camino a Lampa 1500", city: "Quilicura", rent: 1200000, currency: "CLP", status: "reservada", publishStatus: "publicada", bedrooms: 0, bathrooms: 1, surface: 600, ownerId: "o3", agentId: "u4", createdAt: daysAgo(15), images: img("p10","photo-1553413077-190dd305871c","photo-1565793298595-6a879b1d9492"), amenities: ["Andén de carga","Altura 8m","Oficinas"] },
];

const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600000).toISOString();

export const leads: Lead[] = [
  { id: "l1", name: "Antonia Rojas", email: "arojas@mail.cl", phone: "+56 9 1111 2222", propertyId: "p1", stage: "visita", createdAt: daysAgo(1) },
  { id: "l2", name: "Felipe Muñoz", email: "fmunoz@mail.cl", phone: "+56 9 3333 4444", propertyId: "p4", stage: "aplicacion", createdAt: daysAgo(3) },
  { id: "l3", name: "Sofía Lara", email: "slara@mail.cl", phone: "+56 9 5555 6666", propertyId: "p5", stage: "nuevo", createdAt: daysAgo(0) },
  { id: "l4", name: "Joaquín Vidal", email: "jvidal@mail.cl", phone: "+56 9 7777 8888", propertyId: "p9", stage: "contactado", createdAt: daysAgo(2) },
  { id: "l5", name: "Constanza Bravo", email: "cbravo@mail.cl", phone: "+56 9 9999 0000", propertyId: "p1", stage: "nuevo", createdAt: daysAgo(0) },
  { id: "l6", name: "Matías Fuentes", email: "mfuentes@mail.cl", phone: "+56 9 2222 3333", propertyId: "p2", stage: "ganado", createdAt: daysAgo(8) },
  { id: "l7", name: "Renata Silva", email: "rsilva@mail.cl", phone: "+56 9 4444 5555", propertyId: "p6", stage: "visita", createdAt: daysAgo(4) },
  { id: "l8", name: "Diego Carrasco", email: "dcarrasco@mail.cl", phone: "+56 9 6666 7777", propertyId: "p9", stage: "perdido", createdAt: daysAgo(12) },
];

export const visits: Visit[] = [
  { id: "v1", propertyId: "p1", leadId: "l1", date: hoursFromNow(26), status: "programada", durationMin: 45, notes: "Cliente prefiere visita por la tarde, viene con su pareja." },
  { id: "v2", propertyId: "p5", leadId: "l3", date: hoursFromNow(50), status: "programada", durationMin: 30, notes: "Primera visita, mostrar terraza y bodega." },
  { id: "v3", propertyId: "p9", leadId: "l4", date: hoursFromNow(74), status: "programada", durationMin: 60, notes: "Revisar estacionamiento extra." },
  { id: "v4", propertyId: "p4", leadId: "l2", date: daysAgo(1), status: "realizada", durationMin: 60, notes: "Visita exitosa, va a enviar aplicación." },
  { id: "v5", propertyId: "p6", leadId: "l7", date: hoursFromNow(120), status: "programada", durationMin: 45, notes: "Visita familiar." },
  { id: "v6", propertyId: "p2", leadId: "l6", date: daysAgo(6), status: "realizada", durationMin: 45 },
  { id: "v7", propertyId: "p1", leadId: "l5", date: hoursFromNow(8), status: "programada", durationMin: 30, notes: "Tour rápido." },
  { id: "v8", propertyId: "p9", leadId: "l8", date: daysAgo(10), status: "cancelada", durationMin: 30, notes: "Cliente no se presentó." },
];

export const documents: Document[] = [
  { id: "d1", name: "Contrato Loft Bellas Artes.pdf", kind: "contrato", status: "verificado", propertyId: "p3", uploadedAt: daysAgo(40), expiresAt: new Date(now.getTime() + 60 * 86400000).toISOString(), size: "1.2 MB" },
  { id: "d2", name: "Cédula Felipe Muñoz.pdf", kind: "cedula", status: "verificado", leadId: "l2", uploadedAt: daysAgo(3), size: "420 KB" },
  { id: "d3", name: "Comprobante renta Sofía Lara.pdf", kind: "comprobante", status: "pendiente", leadId: "l3", uploadedAt: daysAgo(1), size: "680 KB" },
  { id: "d4", name: "Garantía Casa Ñuñoa.pdf", kind: "garantia", status: "verificado", propertyId: "p2", uploadedAt: daysAgo(7), size: "300 KB" },
  { id: "d5", name: "Contrato Estudio Italia.pdf", kind: "contrato", status: "vencido", propertyId: "p7", uploadedAt: daysAgo(380), expiresAt: daysAgo(20), size: "1.1 MB" },
  { id: "d6", name: "Cédula Renata Silva.jpg", kind: "cedula", status: "rechazado", leadId: "l7", uploadedAt: daysAgo(2), size: "1.8 MB" },
  { id: "d7", name: "Boleta servicios Chicureo.pdf", kind: "comprobante", status: "verificado", propertyId: "p6", uploadedAt: daysAgo(5), size: "240 KB" },
  { id: "d8", name: "Contrato Bodega Quilicura.pdf", kind: "contrato", status: "pendiente", propertyId: "p10", uploadedAt: daysAgo(15), expiresAt: new Date(now.getTime() + 25 * 86400000).toISOString(), size: "1.4 MB" },
];

export const activities: Activity[] = [
  { id: "a1", type: "lead", message: "Nuevo interesado registrado", userId: "u3", entityId: "l3", entityLabel: "Sofía Lara · Lastarria", date: daysAgo(0) },
  { id: "a2", type: "visita", message: "Visita agendada", userId: "u3", entityId: "v1", entityLabel: "Antonia Rojas · Providencia", date: daysAgo(0) },
  { id: "a3", type: "documento", message: "Contrato cargado", userId: "u4", entityId: "p2", entityLabel: "Casa Ñuñoa", date: daysAgo(1) },
  { id: "a4", type: "propiedad", message: "Propiedad publicada", userId: "u3", entityId: "p5", entityLabel: "Departamento Lastarria", date: daysAgo(1) },
  { id: "a5", type: "oportunidad", message: "Aplicación recibida", userId: "u4", entityId: "l2", entityLabel: "Felipe Muñoz · Las Condes", date: daysAgo(3) },
  { id: "a6", type: "contrato", message: "Contrato firmado", userId: "u4", entityId: "p3", entityLabel: "Loft Bellas Artes", date: daysAgo(40) },
];

export const finances: Finance[] = [
  { id: "f1", kind: "ingreso", concept: "Canon Loft Bellas Artes", amount: 480000, date: daysAgo(2), propertyId: "p3" },
  { id: "f2", kind: "ingreso", concept: "Canon Estudio Italia", amount: 380000, date: daysAgo(2), propertyId: "p7" },
  { id: "f3", kind: "ingreso", concept: "Comisión Casa Ñuñoa", amount: 850000, date: daysAgo(7), propertyId: "p2" },
  { id: "f4", kind: "gasto", concept: "Mantención piscina Chicureo", amount: 120000, date: daysAgo(5), propertyId: "p6" },
  { id: "f5", kind: "gasto", concept: "Publicación portales", amount: 89000, date: daysAgo(10) },
  { id: "f6", kind: "ingreso", concept: "Canon Departamento Providencia", amount: 650000, date: daysAgo(15), propertyId: "p1" },
  { id: "f7", kind: "ingreso", concept: "Comisión Oficina Las Condes", amount: 920000, date: daysAgo(22), propertyId: "p4" },
  { id: "f8", kind: "gasto", concept: "Reparación gasfitería Lastarria", amount: 145000, date: daysAgo(18), propertyId: "p5" },
  { id: "f9", kind: "gasto", concept: "Servicios legales", amount: 220000, date: daysAgo(25) },
  { id: "f10", kind: "gasto", concept: "Marketing Q3", amount: 180000, date: daysAgo(33) },

];
