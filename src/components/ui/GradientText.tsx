import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface GradientTextProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
}

export function GradientText({ children, className, ...props }: GradientTextProps) {
  return (
    <span
      className={cn(
        "bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)] bg-clip-text text-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
