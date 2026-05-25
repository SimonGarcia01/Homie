const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type LoginField = "email" | "password";
export type RegisterField =
  | "firstName"
  | "lastName"
  | "organizationName"
  | "email"
  | "password"
  | "confirmPassword";

export class AuthError extends Error {
  readonly status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function translateAuthError(message: string, status?: number): string {
  const normalized = message.trim();

  if (normalized === "Invalid credentials" || status === 401) {
    return "Correo o contraseña incorrectos. Revisa tus datos o crea una cuenta.";
  }
  if (normalized === "Email already registered" || status === 409) {
    return "Ya existe una cuenta con ese correo. Prueba iniciar sesión.";
  }
  if (normalized === "Missing access token") {
    return "Tu sesión expiró. Vuelve a iniciar sesión.";
  }
  if (normalized === "Failed to fetch" || normalized.includes("NetworkError")) {
    return "No pudimos conectar con el servidor. Verifica que el backend esté corriendo.";
  }
  if (status && status >= 500) {
    return "El servidor no respondió. Intenta de nuevo en unos segundos.";
  }

  if (normalized.includes("email must be an email")) {
    return "El correo no tiene un formato válido.";
  }
  if (normalized.includes("password must be longer")) {
    return "La contraseña debe tener al menos 8 caracteres.";
  }

  return normalized;
}

export function validateLoginForm(email: string, password: string): Partial<Record<LoginField, string>> {
  const errors: Partial<Record<LoginField, string>> = {};
  const trimmedEmail = email.trim();

  if (!trimmedEmail) {
    errors.email = "Ingresa tu correo.";
  } else if (!EMAIL_RE.test(trimmedEmail)) {
    errors.email = "El correo no tiene un formato válido.";
  }

  if (!password) {
    errors.password = "Ingresa tu contraseña.";
  }

  return errors;
}

export function validateRegisterForm(input: {
  firstName: string;
  lastName: string;
  organizationName: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Partial<Record<RegisterField, string>> {
  const errors: Partial<Record<RegisterField, string>> = {};

  if (!input.firstName.trim()) errors.firstName = "Ingresa tu nombre.";
  if (!input.lastName.trim()) errors.lastName = "Ingresa tu apellido.";
  if (!input.organizationName.trim()) {
    errors.organizationName = "Indica el nombre de tu corretaje o equipo.";
  } else if (input.organizationName.trim().length < 2) {
    errors.organizationName = "El nombre debe tener al menos 2 caracteres.";
  }

  const email = input.email.trim();
  if (!email) {
    errors.email = "Ingresa tu correo.";
  } else if (!EMAIL_RE.test(email)) {
    errors.email = "El correo no tiene un formato válido.";
  }

  if (!input.password) {
    errors.password = "Elige una contraseña.";
  } else if (input.password.length < 8) {
    errors.password = "Debe tener al menos 8 caracteres.";
  }

  if (!input.confirmPassword) {
    errors.confirmPassword = "Confirma tu contraseña.";
  } else if (input.password !== input.confirmPassword) {
    errors.confirmPassword = "Las contraseñas no coinciden.";
  }

  return errors;
}

export function firstFieldError(errors: Record<string, string | undefined>): string | null {
  return Object.values(errors).find(Boolean) ?? null;
}
