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
      className: cn("py-10 sm:py-12 lg:py-16", className),
      ...rest,
    },
    children,
  );
}
