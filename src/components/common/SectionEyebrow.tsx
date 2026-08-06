import { cn } from "@/lib/utils";

export interface SectionEyebrowProps {
  children: string;
  className?: string;
}

/**
 * The "— LABEL" line repeated above nearly every section heading.
 * No 'use client' needed — pure static text, safe as a Server Component.
 */
export function SectionEyebrow({ children, className }: SectionEyebrowProps) {
  return (
    <p className={cn("mb-2 font-body text-xs tracking-[0.2em] text-primary", className)}>
      — {children}
    </p>
  );
}
