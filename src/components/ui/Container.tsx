import { createElement } from "react";
import type { PolymorphicProps } from "@/types/ui/polymorphic";
import type { Size } from "@/types/ui/common";
import { cn } from "@/lib/utils";

export interface ContainerProps extends PolymorphicProps<"div"> {
  size?: Size | "full";
}

const sizeClass: Record<Size | "full", string> = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-[1280px]",
  full: "max-w-none",
};

export function Container({
  as = "div",
  size = "xl",
  className,
  children,
  ...rest
}: ContainerProps) {
  return createElement(
    as,
    {
      className: cn("mx-auto w-full px-5 sm:px-10 lg:px-20", sizeClass[size], className),
      ...rest,
    },
    children,
  );
}
