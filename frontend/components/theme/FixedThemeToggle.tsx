import { ThemeToggle } from "@/components/theme/ThemeToggle";

/** Toggle fijo para páginas de auth sin header propio */
export function FixedThemeToggle() {
  return (
    <div className="fixed top-4 right-4 z-50">
      <ThemeToggle variant="pill" />
    </div>
  );
}
