"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { fadeInUp } from "@/styles/animations";
import { useEntranceDelay } from "@/lib/a11y/use-entrance-delay";
import type { CaseStudyResult } from "@/types/domain/case-study";

export interface ResultsGridProps {
  results: CaseStudyResult[];
}

/**
 * Renders up to 4 result cards (result1..result4 from WordPress ACF,
 * normalized by adaptCaseStudy into a plain array). WordPress can return
 * anywhere from 0 to 4 complete label/value pairs — incomplete pairs are
 * already dropped by the adapter, so an empty array here just means the
 * case study hasn't had any results filled in yet, and the section is
 * omitted rather than rendering empty cards.
 */
export function ResultsGrid({ results }: ResultsGridProps) {
  // Hooks must run before the early return below (rules-of-hooks).
  const entranceDelay = useEntranceDelay();

  if (results.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {results.map((result, index) => (
        <motion.div
          key={result.label}
          {...fadeInUp}
          transition={{
            ...fadeInUp.transition,
            delay: entranceDelay(index * 0.05),
          }}
        >
          <Card className="flex h-full flex-col items-center gap-1 text-center">
            <p className="font-heading text-2xl font-bold text-white sm:text-3xl">
              {result.value}
            </p>
            <p className="font-body text-muted text-xs">{result.label}</p>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
