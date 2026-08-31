import type { ButtonHTMLAttributes, ReactNode } from "react";
import { buttonClassName, type ButtonSize, type ButtonVariant } from "./buttonStyles";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  iconOnly?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export function Button({ variant = "secondary", size = "md", iconOnly = false, loading = false, className, type = "button", children, disabled, ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClassName({ variant, size, iconOnly, className })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <span className="ui-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
