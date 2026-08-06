import { createElement } from "react";
import type { PolymorphicProps } from "@/types/ui/polymorphic";
import { cn } from "@/lib/utils";

export type GlassSurfaceProps = PolymorphicProps<"div">;

export function GlassSurface({ as = "div", className, children, ...rest }: GlassSurfaceProps) {
  return createElement(
    as,
    {
      className: cn(
        "border border-border-strong bg-glass shadow-[var(--shadow-inner-glass)]",
        className,
      ),
      ...rest,
    },
    children,
  );
}
