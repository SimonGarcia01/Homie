"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sprout, Loader2 } from "lucide-react";
import { AuthFormAlert, fieldErrorClass } from "@/components/auth/AuthFormAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError, validateLoginForm, type LoginField } from "@/lib/auth-messages";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/app";
  const [email, setEmail] = useState("admin@boho.test");
  const [password, setPassword] = useState("Admin1234!");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<LoginField, string>>>({});

  function clearFieldError(field: LoginField) {
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

    const errors = validateLoginForm(email, password);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setLoading(true);
    try {
      await login(email.trim(), password);
      toast({ title: "Bienvenido a Homie", description: "Tu cartera te está esperando." });
      router.replace(from);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión";
      setFormError(message);
      if (err instanceof AuthError && err.status === 401) {
        setFieldErrors({
          email: "No encontramos una cuenta con esos datos.",
          password: "Revisa tu contraseña e intenta de nuevo.",
        });
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-2 bg-background">
      <section className="flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-10 group">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-leaf shadow-soft transition-transform group-hover:rotate-[-6deg]">
              <Sprout className="h-5 w-5 text-primary-foreground" />
            </span>
            <span className="font-display text-2xl font-semibold tracking-tight">Homie</span>
          </Link>

          <h1 className="font-display text-4xl font-semibold tracking-tight text-foreground">
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-muted-foreground">Ingresa a tu jardín de arriendos.</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5" noValidate>
            {formError && (
              <AuthFormAlert
                title="No pudimos iniciar sesión"
                message={formError}
              />
            )}

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
                aria-describedby={fieldErrors.email ? "email-error" : undefined}
              />
              {fieldErrors.email && (
                <p id="email-error" className="text-xs text-destructive">
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearFieldError("password");
                }}
                className={cn("h-11", fieldErrorClass(!!fieldErrors.password))}
                aria-invalid={!!fieldErrors.password}
                aria-describedby={fieldErrors.password ? "password-error" : undefined}
              />
              {fieldErrors.password && (
                <p id="password-error" className="text-xs text-destructive">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Entrar a Homie"}
            </Button>
          </form>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            ¿No tienes cuenta?{" "}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Crear cuenta
            </Link>
          </p>

          <p className="mt-3 text-xs text-muted-foreground text-center">
            Demo: admin@boho.test / Admin1234!
          </p>
        </div>
      </section>

      <section className="hidden lg:flex relative overflow-hidden bg-gradient-garden items-center justify-center p-12">
        <div className="relative z-10 max-w-md text-center">
          <Sprout className="h-16 w-16 text-primary mx-auto animate-sway" />
          <h2 className="mt-6 font-display text-3xl font-semibold text-foreground">
            Cultiva tu cartera con calma
          </h2>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            Propiedades, leads, visitas y finanzas en un solo espacio diseñado para brokers.
          </p>
        </div>
      </section>
    </main>
  );
}
