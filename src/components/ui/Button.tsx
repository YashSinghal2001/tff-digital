"use client";

import type { ButtonHTMLAttributes } from "react";
import type { Size, Variant } from "@/types/ui/common";
import { buttonVariants } from "@/components/ui/button-variants";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export { buttonVariants };

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  return (
    <button className={buttonVariants({ variant, size, className })} {...props} />
  );
}
