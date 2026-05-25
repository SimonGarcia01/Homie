import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

export function AuthFormAlert({
  title,
  message,
  className,
}: {
  title?: string;
  message: string;
  className?: string;
}) {
  return (
    <Alert variant="destructive" className={cn("rounded-xl", className)}>
      <AlertCircle className="h-4 w-4" />
      {title ? <AlertTitle>{title}</AlertTitle> : null}
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function fieldErrorClass(hasError: boolean) {
  return hasError ? "border-destructive focus-visible:ring-destructive" : undefined;
}
