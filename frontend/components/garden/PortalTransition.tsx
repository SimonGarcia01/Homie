"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export type PortalOrigin = { x: number; y: number; w: number; h: number; to: string; tone?: string };

/**
 * Subtle "portal" hint: a soft glow pulses on the clicked card, then navigates.
 */
export function PortalTransition({ origin, onDone }: { origin: PortalOrigin | null; onDone: () => void }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "expand">("idle");

  useEffect(() => {
    if (!origin) {
      setPhase("idle");
      return;
    }
    const r = requestAnimationFrame(() => setPhase("expand"));
    const navTimer = window.setTimeout(() => router.push(origin.to), 220);
    const cleanupTimer = window.setTimeout(() => onDone(), 340);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(navTimer);
      clearTimeout(cleanupTimer);
    };
  }, [origin, router, onDone]);

  if (!origin) return null;
  const expanded = phase === "expand";

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <div
        className="absolute rounded-[1.25rem]"
        style={{
          left: origin.x,
          top: origin.y,
          width: origin.w,
          height: origin.h,
          background:
            "radial-gradient(circle at center, hsl(var(--primary) / 0.12) 0%, transparent 70%)",
          transform: `scale(${expanded ? 1.06 : 1})`,
          transformOrigin: "center",
          transition: "transform 260ms cubic-bezier(0.4, 0, 0.2, 1), opacity 260ms ease-out",
          opacity: expanded ? 0 : 0.9,
        }}
      />
    </div>
  );
}
