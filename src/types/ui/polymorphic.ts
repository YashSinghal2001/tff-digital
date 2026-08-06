import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

export type PolymorphicProps<TElement extends ElementType> = {
  as?: TElement;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<TElement>, "as" | "children">;
