"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sprout, Loader2 } from "lucide-react";
import { AuthFormAlert, fieldErrorClass } from "@/components/auth/AuthFormAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError, validateRegisterForm, type RegisterField } from "@/lib/auth-messages";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FixedThemeToggle } from "@/components/theme/FixedThemeToggle";

function FieldHint({ id, message }: { id: string; message: string }) {
  return (
    <p id={id} className="text-xs text-destructive">
      {message}
    </p>
  );
}

export default function Register() {
  const { register } = useAuth();
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<RegisterField, string>>>({});

  function clearFieldError(field: RegisterField) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormError(null);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    const errors = validateRegisterForm({
      firstName,
      lastName,
      organizationName,
      email,
      password,
      confirmPassword,
    });
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        organizationName: organizationName.trim(),
        email: email.trim(),
        password,
      });
      toast({ title: "Cuenta creada", description: "Tu jardín está listo para sembrar." });
      router.replace("/app");
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo crear la cuenta";
      setFormError(message);
      if (err instanceof AuthError && err.status === 409) {
        setFieldErrors({ email: "Este correo ya está registrado." });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      <FixedThemeToggle />
      <section className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-leaf shadow-soft transition-transform group-hover:rotate-[-6deg]">
              <Sprout className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">Homie</span>
          </Link>

          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            Planta tu jardín
          </h1>
          <p className="mt-2 text-muted-foreground">Crea tu espacio y empieza a gestionar arriendos.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
            {formError && (
              <AuthFormAlert title="No pudimos crear tu cuenta" message={formError} />
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    clearFieldError("firstName");
                  }}
                  className={cn("h-11", fieldErrorClass(!!fieldErrors.firstName))}
                  aria-invalid={!!fieldErrors.firstName}
                />
                {fieldErrors.firstName && <FieldHint id="firstName-error" message={fieldErrors.firstName} />}
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    clearFieldError("lastName");
                  }}
                  className={cn("h-11", fieldErrorClass(!!fieldErrors.lastName))}
                  aria-invalid={!!fieldErrors.lastName}
                />
                {fieldErrors.lastName && <FieldHint id="lastName-error" message={fieldErrors.lastName} />}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="organizationName">Nombre de tu broker o equipo</Label>
              <Input
                id="organizationName"
                value={organizationName}
                onChange={(e) => {
                  setOrganizationName(e.target.value);
                  clearFieldError("organizationName");
                }}
                placeholder="Homie Brokers"
                className={cn("h-11", fieldErrorClass(!!fieldErrors.organizationName))}
                aria-invalid={!!fieldErrors.organizationName}
              />
              {fieldErrors.organizationName && (
                <FieldHint id="organizationName-error" message={fieldErrors.organizationName} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearFieldError("email");
                }}
                placeholder="tu@correo.cl"
                className={cn("h-11", fieldErrorClass(!!fieldErrors.email))}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && <FieldHint id="email-error" message={fieldErrors.email} />}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                  if (confirmPassword) clearFieldError("confirmPassword");
                }}
                className={cn("h-11", fieldErrorClass(!!fieldErrors.password))}
                aria-invalid={!!fieldErrors.password}
              />
              {fieldErrors.password ? (
                <FieldHint id="password-error" message={fieldErrors.password} />
              ) : (
                <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  clearFieldError("confirmPassword");
                }}
                className={cn("h-11", fieldErrorClass(!!fieldErrors.confirmPassword))}
                aria-invalid={!!fieldErrors.confirmPassword}
              />
              {fieldErrors.confirmPassword && (
                <FieldHint id="confirmPassword-error" message={fieldErrors.confirmPassword} />
              )}
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>
      </section>

      <section className="hidden lg:flex relative overflow-hidden bg-gradient-garden items-center justify-center p-12">
        <div className="relative z-10 max-w-md text-center">
          <Sprout className="h-16 w-16 text-primary mx-auto animate-sway" />
          <h2 className="mt-6 font-display text-3xl font-semibold text-foreground">
            Tu cartera, desde el primer día
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Regístrate y obtén un espacio propio con rol de administrador para invitar a tu equipo después.
          </p>
        </div>
      </section>
    </main>
  );
}
