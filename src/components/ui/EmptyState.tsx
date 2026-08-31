import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export function EmptyState({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("empty-state", className)}>{children}</p>;
}

export function ErrorState({ children = "Something went wrong.", className }: { children?: ReactNode; className?: string }) {
  return <p className={cn("empty-state", "empty-state--error", className)} role="alert">{children}</p>;
}
