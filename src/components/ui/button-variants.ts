import type { Size, Variant } from "@/types/ui/common";
import { cn } from "@/lib/utils";

const base =
  "inline-flex items-center justify-center gap-2.5 rounded-full font-heading font-semibold transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const variantClass: Record<Variant, string> = {
  primary:
    "bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)] text-white hover:brightness-110",
  secondary: "bg-glass border border-border-strong text-white shadow-[var(--shadow-inner-glass)] hover:bg-white/5",
  outline: "bg-glass border border-border-strong text-white shadow-[var(--shadow-inner-glass)] hover:bg-white/5",
  ghost: "text-white hover:bg-white/5",
  link: "text-primary underline-offset-4 hover:underline",
};

const sizeClass: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-[46px] px-[21px] text-sm",
  lg: "h-14 px-8 text-base",
  xl: "h-16 px-10 text-lg",
};

/**
 * Shared class-builder so links styled as buttons (e.g. next/link CTAs)
 * stay visually identical to the real <button> without nesting an <a>
 * inside a <button>. Deliberately has no "use client" — it's a plain
 * string function, callable from Server Components (e.g. PageHero).
 */
export function buttonVariants({
  variant = "primary",
  size = "md",
  className,
}: {
  variant?: Variant;
  size?: Size;
  className?: string;
} = {}) {
  return cn(base, variantClass[variant], sizeClass[size], className);
}
