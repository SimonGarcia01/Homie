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

export default function InteresadoLogin() {
  const { login } = useProspectAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") ?? "/buscar";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      toast({ title: "Bienvenido", description: "Ya puedes guardar favoritos y pedir visitas." });
      router.replace(from);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-warm flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border border-border bg-surface/95 backdrop-blur p-8 shadow-leaf">
        <Link href="/buscar" className="flex items-center gap-2.5 w-fit mb-8">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-leaf shadow-soft">
            <Sprout className="h-5 w-5 text-primary-foreground" />
          </span>
          <span className="font-display text-2xl font-semibold">Homie</span>
        </Link>

        <h1 className="font-display text-2xl font-semibold">Ingresar</h1>
        <p className="text-muted-foreground text-sm mt-1 mb-6">
          Accede para guardar favoritos y solicitar visitas.
        </p>

        {formError && <AuthFormAlert message={formError} className="mb-4" />}

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" variant="hero" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ingresar"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          ¿No tienes cuenta?{" "}
          <Link href={`/interesado/registro?from=${encodeURIComponent(from)}`} className="text-primary hover:underline">
            Regístrate
          </Link>
        </p>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          <Link href="/login" className="hover:underline">Soy broker →</Link>
        </p>
      </div>
    </main>
  );
}
