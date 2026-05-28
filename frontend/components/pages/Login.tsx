"use client";

import { useState, FormEvent, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sprout, Loader2, Shield, Users, UserRound } from "lucide-react";
import { AuthFormAlert, fieldErrorClass } from "@/components/auth/AuthFormAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { AuthError, validateLoginForm, type LoginField } from "@/lib/auth-messages";
import { DEMO_LOGIN_ACCOUNTS } from "@/lib/demo-accounts";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { FixedThemeToggle } from "@/components/theme/FixedThemeToggle";

const ROLE_ICONS = {
  admin: Shield,
  coordinador: Users,
  agente: UserRound,
} as const;

export default function Login() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/app";
  const isDemo = searchParams.get("demo") === "1";
  const [email, setEmail] = useState(isDemo ? DEMO_LOGIN_ACCOUNTS[0].email : "");
  const [password, setPassword] = useState(isDemo ? DEMO_LOGIN_ACCOUNTS[0].password : "");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string | null>(isDemo ? DEMO_LOGIN_ACCOUNTS[0].id : null);
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

  const submitLogin = useCallback(
    async (loginEmail: string, loginPassword: string, roleLabel?: string) => {
      setFormError(null);
      const errors = validateLoginForm(loginEmail, loginPassword);
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
      setFieldErrors({});
      setLoading(true);
      try {
        await login(loginEmail.trim(), loginPassword);
        toast({
          title: "Bienvenido a Homie",
          description: roleLabel
            ? `Entraste como ${roleLabel}. Tu cartera te está esperando.`
            : "Tu cartera te está esperando.",
        });
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
    },
    [from, login, router],
  );

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const account = DEMO_LOGIN_ACCOUNTS.find((a) => a.email === email.trim());
    await submitLogin(email, password, account?.roleLabel);
  }

  function selectDemoAccount(account: (typeof DEMO_LOGIN_ACCOUNTS)[number]) {
    setSelectedRole(account.id);
    setEmail(account.email);
    setPassword(account.password);
    setFieldErrors({});
    setFormError(null);
  }

  async function enterAsRole(account: (typeof DEMO_LOGIN_ACCOUNTS)[number]) {
    selectDemoAccount(account);
    await submitLogin(account.email, account.password, account.roleLabel);
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
            Bienvenido de vuelta
          </h1>
          <p className="mt-2 text-muted-foreground">Ingresa a tu jardín de arriendos.</p>

          <div className="mt-8 space-y-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Demo por rol</p>
            <div className="grid gap-2">
              {DEMO_LOGIN_ACCOUNTS.map((account) => {
                const Icon = ROLE_ICONS[account.id as keyof typeof ROLE_ICONS] ?? UserRound;
                const active = selectedRole === account.id;
                return (
                  <button
                    key={account.id}
                    type="button"
                    disabled={loading}
                    onClick={() => void enterAsRole(account)}
                    className={cn(
                      "w-full text-left rounded-xl border px-4 py-3 transition hover:border-primary/40 hover:bg-surface-muted/50 disabled:opacity-60",
                      active ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border bg-surface",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground">{account.roleLabel}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{account.description}</p>
                        <p className="text-[11px] text-muted-foreground/80 mt-1 truncate">{account.email}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">o con tu correo</span>
            </div>
          </div>

          <form onSubmit={onSubmit} className="space-y-5" noValidate>
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
                  setSelectedRole(null);
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
                  setSelectedRole(null);
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
            Cuentas demo del seed: admin, coord y agent @boho.test
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
            Cada rol ve lo que necesita: admin gestiona todo, coordinador supervisa, agente opera el día a día.
          </p>
        </div>
      </section>
    </main>
  );
}
