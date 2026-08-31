import { cn } from "../../lib/cn";

export function StatusDot({ state = "live", className }: { state?: "live" | "wire" | "final"; className?: string }) {
  return <span className={cn("status-dot", `status-dot--${state}`, className)} aria-hidden="true" />;
}
