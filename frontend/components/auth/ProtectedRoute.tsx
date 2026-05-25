"use client";

import { useRouter, usePathname } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getAccessToken } from "@/lib/api/auth";
import type { Role } from "@/lib/mock/db";
import { Sprout } from "lucide-react";

export function ProtectedRoute({ children, roles }: { children: ReactNode; roles?: Role[] }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasToken = typeof window !== "undefined" && !!getAccessToken();
  const waitingForSession = loading || (hasToken && !user);

  useEffect(() => {
    if (waitingForSession) return;
    if (!user) {
      router.replace(`/login?from=${encodeURIComponent(pathname)}`);
      return;
    }
    if (roles && !roles.includes(user.role)) {
      router.replace("/app");
    }
  }, [user, waitingForSession, roles, router, pathname]);

  if (waitingForSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Sprout className="h-8 w-8 text-primary animate-sway" />
      </div>
    );
  }

  if (!user) return null;
  if (roles && !roles.includes(user.role)) return null;

  return <>{children}</>;
}
