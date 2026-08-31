import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";

export function Skeleton({ className, width, height }: { className?: string; width?: CSSProperties["width"]; height?: CSSProperties["height"] }) {
  return <div className={cn("ui-skeleton", className)} style={{ width, height }} aria-hidden="true" />;
}
