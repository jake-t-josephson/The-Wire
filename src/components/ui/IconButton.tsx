import type { ButtonProps } from "./Button";
import { Button } from "./Button";

export interface IconButtonProps extends Omit<ButtonProps, "iconOnly"> {
  "aria-label": string;
}

export function IconButton(props: IconButtonProps) {
  return <Button iconOnly {...props} />;
}
