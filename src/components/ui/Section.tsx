import { createElement } from "react";
import type { PolymorphicProps } from "@/types/ui/polymorphic";
import { cn } from "@/lib/utils";

export interface SectionProps extends PolymorphicProps<"section"> {
  id?: string;
}

export function Section({ as = "section", className, children, ...rest }: SectionProps) {
  return createElement(
    as,
    {
      className: cn("py-12 sm:py-16 lg:py-24", className),
      ...rest,
    },
    children,
  );
}
