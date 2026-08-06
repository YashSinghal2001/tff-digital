import type { HTMLAttributes, ReactNode } from "react";
import type { Tone } from "@/types/ui/common";
import { cn } from "@/lib/utils";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: Tone;
}

const toneClass: Record<Tone, string> = {
  default: "border-border-subtle text-white",
  success: "border-emerald-500/40 text-emerald-300",
  warning: "border-amber-500/40 text-amber-300",
  error: "border-red-500/40 text-red-300",
  info: "border-primary/40 text-primary",
};

export function Badge({ children, tone = "default", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border bg-glass px-4 py-2.5 font-body text-xs font-medium",
        toneClass[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
