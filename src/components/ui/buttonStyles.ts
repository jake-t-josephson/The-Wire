import { cn } from "../../lib/cn";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "bare";
export type ButtonSize = "sm" | "md";

export function buttonClassName({ variant = "secondary", size = "md", iconOnly = false, className }: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  className?: string;
}) {
  return cn("ui-button", `ui-button--${variant}`, `ui-button--${size}`, iconOnly && "ui-icon-button", className);
}
