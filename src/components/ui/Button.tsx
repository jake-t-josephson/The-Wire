import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  children: ReactNode;
}

export function Button({ variant = "secondary", size = "md", iconOnly = false, className, type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn("ui-button", `ui-button--${variant}`, `ui-button--${size}`, iconOnly && "ui-icon-button", className)}
      {...props}
    />
  );
}
