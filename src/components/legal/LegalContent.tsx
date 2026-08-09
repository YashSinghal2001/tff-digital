import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface LegalContentProps {
  children: ReactNode;
  className?: string;
}

/**
 * Prose wrapper for static legal copy (Privacy Policy, Terms & Conditions).
 * Applies the design system's typography tokens to plain semantic tags via
 * descendant selectors, so pages can write ordinary h2/h3/p/ul markup.
 */
export function LegalContent({ children, className }: LegalContentProps) {
  return (
    <div
      className={cn(
        "font-body text-sm leading-relaxed text-muted [&>*+*]:mt-5",
        "[&_h2]:mt-12 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white",
        "[&_h3]:mt-8 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white",
        "[&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-muted",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
        "[&_li]:text-sm [&_li]:text-muted",
        "[&_strong]:font-semibold [&_strong]:text-white",
        className,
      )}
    >
      {children}
    </div>
  );
}
