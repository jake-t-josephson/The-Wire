import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Eyebrow({ signal = false, className, ...props }: HTMLAttributes<HTMLSpanElement> & { signal?: boolean }) {
  return <span className={cn("eyebrow", signal && "eyebrow--signal", className)} {...props} />;
}

export function SectionLabel({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("section-label", className)} {...props} />;
}
