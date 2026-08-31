import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function VisuallyHidden({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("visually-hidden", className)} {...props} />;
}
