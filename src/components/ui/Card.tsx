import { createElement } from "react";
import type { PolymorphicProps } from "@/types/ui/polymorphic";
import { cn } from "@/lib/utils";

export type CardProps = PolymorphicProps<"div">;

export function Card({ as = "div", className, children, ...rest }: CardProps) {
  return createElement(
    as,
    {
      className: cn(
        "rounded-[25px] border border-border-strong bg-glass p-6",
        className,
      ),
      ...rest,
    },
    children,
  );
}
