"use client";

import { usePathname, useRouter } from "next/navigation";
import { type ReactNode, useEffect } from "react";
import { Sprout } from "lucide-react";
import { useProspectAuth } from "@/contexts/ProspectAuthContext";
import { getProspectToken } from "@/lib/api/prospect-auth";

export function ProspectProtectedRoute({ children }: { children: ReactNode }) {
  const { prospect, loading } = useProspectAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasToken = typeof window !== "undefined" && !!getProspectToken();
  const waiting = loading || (hasToken && !prospect);

  useEffect(() => {
    if (waiting) return;
    if (!prospect) {
      router.replace(`/interesado/login?from=${encodeURIComponent(pathname)}`);
    }
  }, [prospect, waiting, router, pathname]);

  if (waiting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Sprout className="h-8 w-8 text-primary animate-sway" />
      </div>
    );
  }

  if (!prospect) return null;
  return <>{children}</>;
}
