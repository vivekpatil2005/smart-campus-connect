import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
}

export function LoadingSpinner({
  message = "Loading...",
  className = "",
}: LoadingSpinnerProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-16 ${className}`}
    >
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-card p-5 animate-pulse space-y-3">
      <div className="h-4 bg-muted rounded w-3/4" />
      <div className="h-3 bg-muted rounded w-1/2" />
      <div className="h-12 bg-muted rounded w-full" />
      <div className="flex gap-2">
        <div className="h-5 bg-muted rounded w-16" />
        <div className="h-5 bg-muted rounded w-20" />
      </div>
    </div>
  );
}
