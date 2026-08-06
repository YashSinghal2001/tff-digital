import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface GlowProps extends HTMLAttributes<HTMLDivElement> {
  color?: string;
}

export function Glow({ color = "var(--color-primary)", className, style, ...props }: GlowProps) {
  return (
    <div
      aria-hidden
      className={cn("pointer-events-none absolute rounded-full blur-[100px]", className)}
      style={{ background: color, ...style }}
      {...props}
    />
  );
}
