import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
}

const sizeClass: Record<NonNullable<HeadingProps["as"]>, string> = {
  h1: "text-[38px] leading-[1.15] sm:text-[48px] lg:text-[60px] lg:leading-[1.1]",
  h2: "text-[32px] leading-[1.2] sm:text-[40px]",
  h3: "text-[28px] leading-[1.2] sm:text-[36px]",
  h4: "text-[24px] leading-[1.2] sm:text-[32px]",
  h5: "text-[20px] leading-[1.2] sm:text-[24px]",
  h6: "text-base leading-[1.2] sm:text-lg",
};

export function Heading({ as = "h2", className, children, ...props }: HeadingProps) {
  const Tag = as;
  return (
    <Tag
      className={cn("font-heading font-bold text-white", sizeClass[as], className)}
      {...props}
    >
      {children}
    </Tag>
  );
}
