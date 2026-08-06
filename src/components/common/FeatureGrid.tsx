"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { IconCircle } from "@/components/ui/IconCircle";
import type { Size } from "@/types/ui/common";
import { fadeInUp } from "@/styles/animations";
import { cn } from "@/lib/utils";

export interface FeatureGridItem {
  icon: LucideIcon;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}

export interface FeatureGridProps {
  items: FeatureGridItem[];
  /** Tailwind responsive column classes, e.g. "sm:grid-cols-2 lg:grid-cols-3" */
  gridClassName?: string;
  gap?: string;
  cardGap?: string;
  iconSize?: Size;
  titleClassName?: string;
  staggerColumns?: number;
  staggerStep?: number;
  variant?: "feature" | "compact";
}

export function FeatureGrid({
  items,
  gridClassName = "sm:grid-cols-2 lg:grid-cols-3",
  gap = "gap-6",
  cardGap = "gap-4",
  iconSize = "md",
  titleClassName = "text-base",
  staggerColumns = 3,
  staggerStep = 0.05,
  variant = "feature",
}: FeatureGridProps) {
  return (
    <div className={cn("grid", gap, gridClassName)}>
      {items.map((item, index) => (
        <motion.div
          key={item.title}
          {...fadeInUp}
          transition={{ ...fadeInUp.transition, delay: (index % staggerColumns) * staggerStep }}
        >
          {variant === "compact" ? (
            <Card className="flex flex-col items-center gap-3 py-8 text-center">
              <IconCircle icon={item.icon} size={iconSize} />
              <p className="font-heading text-sm font-semibold text-white">{item.title}</p>
            </Card>
          ) : (
            <Card className={cn("flex h-full flex-col", cardGap)}>
              <IconCircle icon={item.icon} size={iconSize} />
              <h3 className={cn("font-heading font-bold text-white", titleClassName)}>
                {item.title}
              </h3>
              {item.description ? (
                <p className="font-body text-sm text-muted">{item.description}</p>
              ) : null}
              {item.href ? (
                <Link
                  href={item.href}
                  className="mt-auto flex items-center gap-1 font-body text-sm font-semibold text-primary"
                >
                  {item.linkLabel ?? "Learn more"}
                  <span className="sr-only"> about {item.title}</span>{" "}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              ) : null}
            </Card>
          )}
        </motion.div>
      ))}
    </div>
  );
}
