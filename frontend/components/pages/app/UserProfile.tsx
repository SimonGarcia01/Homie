"use client";

import { FormEvent, useEffect, useState } from "react";
import { KeyRound, Loader2, User } from "lucide-react";
import { AppShell } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/mock/api";
import { toast } from "@/hooks/use-toast";

export default function UserProfile() {
  const { user, refreshUser } = useAuth();
  const [profileForm, setProfileForm] = useState({ firstName: "", lastName: "", email: "" });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", password: "", confirm: "" });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) return;
    const [firstName, ...rest] = user.name.split(" ");
    setProfileForm({
      firstName: firstName ?? "",
      lastName: rest.join(" ") || firstName || "",
      email: user.email,
    });
  }, [user]);

  async function handleProfileSubmit(e: FormEvent) {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateProfile({
        firstName: profileForm.firstName.trim(),
        lastName: profileForm.lastName.trim(),
        email: profileForm.email.trim(),
      });
      await refreshUser();
      toast({ title: "Perfil actualizado" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo guardar",
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    if (passwordForm.password !== passwordForm.confirm) {
      toast({ title: "Las contraseñas no coinciden", variant: "destructive" });
      return;
    }
    if (passwordForm.password.length < 8) {
      toast({ title: "La contraseña debe tener al menos 8 caracteres", variant: "destructive" });
      return;
    }

    setSavingPassword(true);
    try {
      await api.updateProfile({
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.password,
      });
      setPasswordForm({ currentPassword: "", password: "", confirm: "" });
      toast({ title: "Contraseña actualizada" });
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo cambiar la contraseña",
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <AppShell>
      <header>
        <p className="text-sm text-muted-foreground">Cuenta</p>
        <h1 className="font-display text-3xl md:text-4xl font-semibold tracking-tight">Mi perfil</h1>
        <p className="text-muted-foreground mt-1">Actualiza tu información personal y credenciales.</p>
      </header>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
          <header className="flex items-center gap-3 mb-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">Información personal</h2>
              <p className="text-sm text-muted-foreground">Nombre y correo de contacto</p>
            </div>
          </header>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="profile-first">Nombre</Label>
                <Input
                  id="profile-first"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-last">Apellido</Label>
                <Input
                  id="profile-last"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Correo</Label>
              <Input
                id="profile-email"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <Button type="submit" variant="hero" disabled={savingProfile}>
              {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar cambios"}
            </Button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-6 shadow-soft">
          <header className="flex items-center gap-3 mb-6">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/15 text-accent">
              <KeyRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-lg font-semibold">Cambiar contraseña</h2>
              <p className="text-sm text-muted-foreground">Usa al menos 8 caracteres</p>
            </div>
          </header>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña actual</Label>
              <Input
                id="current-password"
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva contraseña</Label>
              <Input
                id="new-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm((f) => ({ ...f, password: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirmar contraseña</Label>
              <Input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
              />
            </div>
            <Button type="submit" variant="soft" disabled={savingPassword}>
              {savingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : "Actualizar contraseña"}
            </Button>
          </form>
        </section>
      </div>
    </AppShell>
  );
}
