import type { HTMLAttributes } from "react";
import type { LucideIcon } from "lucide-react";
import type { Size } from "@/types/ui/common";
import { cn } from "@/lib/utils";

export interface IconCircleProps extends HTMLAttributes<HTMLSpanElement> {
  icon: LucideIcon;
  size?: Size;
}

export const sizeClass: Record<Size, string> = {
  sm: "h-8 w-8",
  md: "h-11 w-11",
  lg: "h-14 w-14",
  xl: "h-16 w-16",
};

const iconSizeClass: Record<Size, string> = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-7 w-7",
};

export function IconCircle({ icon: Icon, size = "md", className, ...props }: IconCircleProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border border-border-strong bg-glass text-primary",
        sizeClass[size],
        className,
      )}
      {...props}
    >
      <Icon className={iconSizeClass[size]} />
    </span>
  );
}
