"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  ChartBar,
  ChartNoAxesCombined,
  Palette,
  Rocket,
  Search,
  Target,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { buttonVariants } from "@/components/ui/button-variants";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { ROUTES } from "@/constants/routes";
import { fadeInUp } from "@/styles/animations";

interface Step {
  step: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const steps: Step[] = [
  {
    step: "01",
    title: "Discover",
    description:
      "We deep dive into your business, goals, challenges and opportunities.",
    icon: Search,
  },
  {
    step: "02",
    title: "Research",
    description:
      "We analyze your market, competitors and audience to uncover opportunities.",
    icon: ChartBar,
  },
  {
    step: "03",
    title: "Strategy",
    description:
      "We build a data-informed, prioritized roadmap designed to grow.",
    icon: Target,
  },
  {
    step: "04",
    title: "Design",
    description:
      "We craft high-converting experiences and funnels that attract and convert.",
    icon: Palette,
  },
  {
    step: "05",
    title: "Launch",
    description: "We launch campaigns that are tracked, tested and optimized.",
    icon: Rocket,
  },
  {
    step: "06",
    title: "Scale",
    description:
      "We double down on what works and scale for compounding growth.",
    icon: TrendingUp,
  },
];

const gradientLine =
  "bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)]";

/* Icons can't use bg-clip-text, so their stroke references this SVG gradient. */
const iconGradientStroke = { stroke: "url(#hww-icon-gradient)" } as const;

function TimelineNode({ className }: { className?: string }) {
  return (
    <span
      className={`absolute h-4 w-4 rounded-full ring-4 ring-background ${gradientLine} ${className ?? ""}`}
    />
  );
}

function StepContent({ step }: { step: Step }) {
  const Icon = step.icon;
  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-3 left-10 select-none font-heading text-[56px] font-bold leading-none text-white/5 lg:text-[64px]"
      >
        {step.step}
      </span>
      <span className="relative inline-flex h-12 w-12 items-center justify-center rounded-full border border-border-strong bg-glass">
        <Icon className="h-5 w-5" style={iconGradientStroke} />
      </span>
      <h3 className="mt-5 font-heading text-lg font-bold text-white">
        {step.title}
      </h3>
      <p className="mt-2 max-w-[280px] font-body text-sm leading-relaxed text-muted">
        {step.description}
      </p>
    </div>
  );
}

const colStart = ["col-start-1", "col-start-2", "col-start-3"];

function TimelineRow({
  rowSteps,
  stripRow,
  contentRow,
}: {
  rowSteps: Step[];
  stripRow: string;
  contentRow: string;
}) {
  return (
    <>
      <div className={`relative col-start-1 col-span-3 h-4 ${stripRow}`}>
        <span
          className={`absolute left-2 right-0 top-1/2 h-px -translate-y-1/2 ${gradientLine}`}
        />
        <TimelineNode className="left-0 top-1/2 -translate-y-1/2" />
        <TimelineNode className="left-1/3 top-1/2 -translate-y-1/2" />
        <TimelineNode className="left-2/3 top-1/2 -translate-y-1/2" />
      </div>
      {rowSteps.map((step, index) => (
        <div
          key={step.step}
          className={`${colStart[index]} pr-8 pt-6 ${contentRow}`}
        >
          <StepContent step={step} />
        </div>
      ))}
    </>
  );
}

export function HowWeWork() {
  return (
    <section id="process" className="py-16 lg:py-24">
      {/* Shared gradient for icon strokes (stroke can't use CSS text gradients) */}
      <svg aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <linearGradient id="hww-icon-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: "var(--color-primary)" }} />
            <stop offset="1" style={{ stopColor: "var(--color-secondary)" }} />
          </linearGradient>
        </defs>
      </svg>

      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12 lg:mb-16">
          <SectionEyebrow>HOW WE WORK</SectionEyebrow>
          <Heading as="h2">
            A proven <GradientText>six-step</GradientText> growth engine.
          </Heading>
          <p className="mt-4 max-w-md font-body text-sm leading-relaxed text-muted">
            From insight to execution, every step has a purpose and every action
            drives measurable results.
          </p>
        </motion.div>

        {/* Desktop: two-row zig-zag timeline with a dashed curve joining the rows */}
        <motion.div {...fadeInUp} className="hidden lg:block">
          <div className="grid grid-cols-[1fr_1fr_1fr_72px] grid-rows-[16px_auto_64px_16px_auto]">
            <TimelineRow
              rowSteps={steps.slice(0, 3)}
              stripRow="row-start-1"
              contentRow="row-start-2"
            />
            <div className="relative col-start-4 row-start-1 row-span-3">
              {/* top-2/-bottom-2 anchors the curve to both rows' line centers */}
              <div className="absolute inset-x-0 top-2 -bottom-2">
                <svg
                  className="h-full w-full overflow-visible"
                  viewBox="0 0 72 100"
                  preserveAspectRatio="none"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M0 0 C 70 0, 70 100, 0 100"
                    stroke="var(--color-secondary)"
                    strokeOpacity="0.5"
                    strokeDasharray="5 6"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            </div>
            <TimelineRow
              rowSteps={steps.slice(3, 6)}
              stripRow="row-start-4"
              contentRow="row-start-5"
            />
          </div>
        </motion.div>

        {/* Mobile / tablet: vertical timeline */}
        <div className="relative lg:hidden">
          <span
            className="absolute bottom-2 left-2 top-2 w-px bg-[linear-gradient(180deg,var(--color-primary)_0%,var(--color-secondary)_100%)]"
          />
          <div className="flex flex-col gap-10">
            {steps.map((step, index) => (
              <motion.div
                key={step.step}
                {...fadeInUp}
                transition={{ ...fadeInUp.transition, delay: index * 0.05 }}
                className="relative pl-10"
              >
                <TimelineNode className="left-0 top-1" />
                <StepContent step={step} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA panel */}
        <motion.div {...fadeInUp}>
          <Card className="mt-14 sm:p-8 lg:mt-20">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:gap-8">
              <div className="flex flex-1 flex-col gap-5 sm:flex-row sm:items-center">
                <span className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-border-strong bg-glass">
                  <ChartNoAxesCombined
                    className="h-6 w-6"
                    style={iconGradientStroke}
                  />
                </span>
                <div>
                  <h3 className="font-heading text-xl font-bold text-white sm:text-2xl">
                    Built for growth. Backed by data.
                  </h3>
                  <p className="mt-1.5 max-w-lg font-body text-sm leading-relaxed text-muted">
                    Strategy, creativity and performance working together as one
                    growth engine for your business.
                  </p>
                </div>
              </div>
              <span className="hidden h-14 w-px shrink-0 bg-border-subtle lg:block" />
              <Link
                href={ROUTES.contact}
                className={buttonVariants({
                  size: "md",
                  className: "sm:self-start lg:self-center",
                })}
              >
                Book Free Consultation
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
          </Card>
        </motion.div>
      </Container>
    </section>
  );
}
