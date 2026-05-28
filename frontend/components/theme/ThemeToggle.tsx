"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  /** icon = solo sol/luna · pill = segmento Claro / Oscuro */
  variant?: "icon" | "pill";
};

export function ThemeToggle({ className, variant = "pill" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  if (!mounted) {
    return (
      <div
        className={cn(
          "rounded-full bg-muted/40 animate-pulse",
          variant === "pill" ? "h-9 w-[7.5rem]" : "h-9 w-9",
          className,
        )}
        aria-hidden
      />
    );
  }

  function toggle() {
    setTheme(isDark ? "light" : "dark");
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        className={cn(
          "relative inline-flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors",
          className,
        )}
        aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
        onClick={toggle}
      >
        <Sun className="h-[1.15rem] w-[1.15rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
        <Moon className="absolute h-[1.15rem] w-[1.15rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Tema de la interfaz"
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-surface p-0.5 shadow-soft",
        className,
      )}
    >
      <button
        type="button"
        aria-pressed={!isDark}
        onClick={() => setTheme("light")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors",
          !isDark
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Sun className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Claro</span>
      </button>
      <button
        type="button"
        aria-pressed={isDark}
        onClick={() => setTheme("dark")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors",
          isDark
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        <Moon className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Oscuro</span>
      </button>
    </div>
  );
}
