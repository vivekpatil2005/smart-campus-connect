import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 px-8 text-center">
      {icon && <div className="text-4xl opacity-40">{icon}</div>}
      <div className="space-y-1">
        <h3 className="font-heading text-lg font-semibold text-foreground">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm max-w-xs">{description}</p>
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
