import type { ReactNode } from "react";
import { Link, type LinkProps } from "react-router-dom";
import { buttonClassName, type ButtonSize, type ButtonVariant } from "./buttonStyles";

export interface LinkButtonProps extends LinkProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
}

export function LinkButton({ variant = "secondary", size = "md", className, ...props }: LinkButtonProps) {
  return <Link className={buttonClassName({ variant, size, className })} {...props} />;
}
