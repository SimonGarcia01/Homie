"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Sprout, Loader2 } from "lucide-react";
import { AuthFormAlert } from "@/components/auth/AuthFormAlert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProspectAuth } from "@/contexts/ProspectAuthContext";
import { toast } from "@/hooks/use-toast";
import { FixedThemeToggle } from "@/components/theme/FixedThemeToggle";

export default function InteresadoRegister() {
  const { register } = useProspectAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/buscar";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (password !== confirmPassword) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }
    if (password.length < 8) {
      setFormError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    setLoading(true);
    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
      });
      toast({ title: "Cuenta creada", description: "Ya puedes explorar y solicitar visitas." });
      router.replace(from);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al registrarse");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-warm flex items-center justify-center p-6">
      <FixedThemeToggle />
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface/95 backdrop-blur p-8 shadow-leaf">
        <Link href="/buscar" className="flex items-center gap-2.5 w-fit mb-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-leaf shadow-soft">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-2xl font-semibold">Homie</span>
        </Link>

        <h1 className="font-display text-2xl font-semibold">Crear cuenta</h1>
        <p className="text-muted-foreground text-sm mt-1 mb-6">
          Regístrate para guardar favoritos y pedir visitas a propiedades.
        </p>

        {formError && <AuthFormAlert message={formError} className="mb-4" />}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nombre</Label>
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Apellido</Label>
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Teléfono (opcional)</Label>
            <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
            <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Crear cuenta"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          ¿Ya tienes cuenta?{" "}
          <Link href={`/interesado/login?from=${encodeURIComponent(from)}`} className="text-primary hover:underline">
            Ingresar
          </Link>
        </p>
      </div>
    </main>
  );
}
