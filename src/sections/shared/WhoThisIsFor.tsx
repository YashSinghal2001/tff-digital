"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CircleCheck, CircleX } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { ROUTES } from "@/constants/routes";
import { fadeInUp } from "@/styles/animations";

export interface WhoThisIsForProps {
  eyebrow?: string;
  heading?: ReactNode;
  description?: string;
  fitItems?: string[];
  notFitItems?: string[];
}

const defaultFitItems = [
  "You want a strategy-first partner, not a task-taker",
  "You're ready to invest in compounding growth, not one-off campaigns",
  "You value senior operators and honest, direct communication",
  "You measure marketing by revenue, not vanity metrics",
];

const defaultNotFitItems = [
  "You need overnight results or guaranteed rankings",
  "You want the cheapest execution, not the right execution",
  "You'd rather chase every trend than commit to a direction",
  "You see marketing as a cost to minimize, not an engine to build",
];

/**
 * Fit / anti-fit qualifier. Deliberately a single split panel rather than
 * two Cards — WhyTFF already owns the two-card comparison pattern, and
 * repeating it here would flatten the page's visual rhythm.
 */
export function WhoThisIsFor({
  eyebrow = "WHO THIS IS FOR",
  heading = "Built for teams playing the long game.",
  description = "The best engagements start with honest expectations — on both sides.",
  fitItems = defaultFitItems,
  notFitItems = defaultNotFitItems,
}: WhoThisIsForProps) {
  return (
    <section id="fit" className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mx-auto mb-8 max-w-2xl text-center">
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
          <Heading as="h2">{heading}</Heading>
          <p className="mx-auto mt-4 max-w-md font-body text-sm text-muted">{description}</p>
        </motion.div>

        <motion.div
          {...fadeInUp}
          className="relative overflow-hidden rounded-[25px] border border-border-strong bg-glass"
        >
          <span
            aria-hidden
            className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent_0%,rgba(56,130,246,0.55)_25%,rgba(139,92,246,0.55)_75%,transparent_100%)]"
          />

          <div className="grid md:grid-cols-2">
            <div className="relative p-6 sm:p-8 lg:p-10">
              <span
                aria-hidden
                className="bg-primary/[0.06] pointer-events-none absolute -top-16 -left-16 h-48 w-48 rounded-full blur-[80px]"
              />
              <h3 className="font-heading text-sm font-bold tracking-wide text-white">
                WE&apos;RE A STRONG FIT IF
              </h3>
              <ul className="mt-5 flex flex-col gap-4">
                {fitItems.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 font-body text-sm text-white"
                  >
                    <CircleCheck className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-border-subtle border-t p-6 sm:p-8 md:border-t-0 md:border-l lg:p-10">
              <h3 className="font-heading text-muted text-sm font-bold tracking-wide">
                PROBABLY NOT, IF
              </h3>
              <ul className="mt-5 flex flex-col gap-4">
                {notFitItems.map((item) => (
                  <li
                    key={item}
                    className="text-muted flex items-start gap-3 font-body text-sm"
                  >
                    <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>

        <motion.p
          {...fadeInUp}
          className="text-muted mt-6 text-center font-body text-sm"
        >
          Recognize yourself on the left?{" "}
          <Link
            href={ROUTES.contact}
            className="text-primary transition-colors hover:text-white"
          >
            Let&apos;s talk.
          </Link>
        </motion.p>
      </Container>
    </section>
  );
}
