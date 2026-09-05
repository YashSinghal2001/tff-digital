"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";
import { fadeInUp } from "@/styles/animations";
import { useEntranceDelay } from "@/lib/a11y/use-entrance-delay";

const steps = [
  {
    title: "Tell us where you are",
    description:
      "A free 30-minute call about your business, your goals, and what's felt stuck.",
  },
  {
    title: "We pinpoint what matters",
    description:
      "We map the gaps in your current setup and rank what will actually move revenue.",
  },
  {
    title: "You get a clear next step",
    description:
      "A short, honest recommendation — whether or not it includes working with us.",
  },
];

/**
 * De-risking section for visitors who don't know which service they need.
 * Numbered vertical timeline on purpose — not another card grid — so the
 * page keeps alternating between panel, narrative, and grid rhythms.
 */
export function NotSureYet() {
  const entranceDelay = useEntranceDelay();

  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-12">
          <motion.div {...fadeInUp}>
            <SectionEyebrow>START SIMPLE</SectionEyebrow>
            <Heading as="h2">
              Not sure what you need yet?{" "}
              <GradientText>Start with a conversation.</GradientText>
            </Heading>
            <p className="text-muted font-body mt-4 max-w-md text-sm leading-relaxed">
              Most growth problems aren&apos;t service problems — they&apos;re
              clarity problems. You don&apos;t need to arrive with a brief.
              Bring the situation; we&apos;ll help you find the highest-leverage
              next step.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-4">
              <Link
                href={ROUTES.contact}
                className={buttonVariants({ size: "md" })}
              >
                Book Free Consultation
              </Link>
              <span className="border-border-subtle bg-glass text-muted font-body inline-flex items-center rounded-full border px-4 py-2 text-xs">
                No pressure. No unnecessary upselling.
              </span>
            </div>
          </motion.div>

          <div className="flex flex-col">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                {...fadeInUp}
                transition={{
                  ...fadeInUp.transition,
                  delay: entranceDelay(index * 0.06),
                }}
                className="flex gap-5 pb-8 last:pb-0"
              >
                <div className="flex flex-col items-center">
                  <span className="border-border-strong bg-glass font-heading flex h-11 w-11 shrink-0 items-center justify-center rounded-full border text-sm font-bold">
                    <GradientText>0{index + 1}</GradientText>
                  </span>
                  {index < steps.length - 1 ? (
                    <span
                      aria-hidden
                      className="bg-border-subtle mt-2 w-px flex-1"
                    />
                  ) : null}
                </div>
                <div className="pt-1.5">
                  <h3 className="font-heading text-base font-bold text-white">
                    {step.title}
                  </h3>
                  <p className="text-muted font-body mt-1 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
