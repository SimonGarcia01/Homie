import Link from "next/link";
import { MarketingShell } from "@/components/homie/MarketingShell";
import { Button } from "@/components/ui/button";

export function StaticPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <MarketingShell>
      <article className="container py-12 md:py-16 max-w-3xl">
        <p className="text-sm text-muted-foreground">Homie</p>
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight mt-1">{title}</h1>
        {subtitle && <p className="text-lg text-muted-foreground mt-4">{subtitle}</p>}
        <div className="mt-8 prose prose-neutral dark:prose-invert max-w-none text-muted-foreground space-y-4">
          {children}
        </div>
        <Button asChild variant="soft" className="mt-10">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </article>
    </MarketingShell>
  );
}
