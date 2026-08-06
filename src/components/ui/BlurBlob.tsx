import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface BlurBlobProps extends HTMLAttributes<HTMLDivElement> {
  color?: string;
}

export function BlurBlob({ color = "var(--color-secondary)", className, style, ...props }: BlurBlobProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute rounded-full opacity-30 blur-[80px]",
        className,
      )}
      style={{ background: color, ...style }}
      {...props}
    />
  );
}
