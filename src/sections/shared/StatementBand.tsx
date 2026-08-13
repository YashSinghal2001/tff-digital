"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { fadeInUp } from "@/styles/animations";

export interface StatementBandProps {
  /** The statement itself; may include <GradientText> for emphasis. */
  children: ReactNode;
  /** Optional single supporting line under the statement. */
  support?: string;
}

/**
 * Full-width narrative pause between content sections: one bold statement,
 * hairline borders, faint centered glow. Rendered as <p> (not a heading) so
 * bands can sit anywhere without breaking the page's h1/h2 outline.
 */
export function StatementBand({ children, support }: StatementBandProps) {
  return (
    <section className="border-border-subtle relative overflow-hidden border-y bg-white/[0.02] py-10 lg:py-14">
      <span
        aria-hidden
        className="bg-primary/[0.07] pointer-events-none absolute top-1/2 left-1/2 h-64 w-[42rem] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full blur-[100px]"
      />
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="relative mx-auto max-w-3xl text-center">
          <p className="font-heading text-[24px] leading-[1.25] font-bold text-white sm:text-[30px]">
            {children}
          </p>
          {support ? (
            <p className="text-muted mx-auto mt-3 max-w-xl font-body text-sm">
              {support}
            </p>
          ) : null}
        </motion.div>
      </Container>
    </section>
  );
}
