"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { GradientText } from "@/components/ui/GradientText";
import { Heading } from "@/components/ui/Heading";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";
import { useEntranceDelay } from "@/lib/a11y/use-entrance-delay";
import { cn } from "@/lib/utils";

export interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "How is TFF different from other agencies?",
    answer:
      "We integrate strategy, brand, and performance marketing into one accountable team instead of handing you off between disconnected vendors.",
  },
  {
    question: "How quickly will I see results?",
    answer:
      "Most clients see early signal within the first 30-60 days, with compounding results building over the first two quarters.",
  },
  {
    question: "Do you work with businesses of my size?",
    answer:
      "We work with ambitious teams from early-stage startups to established mid-market companies ready to invest in growth.",
  },
  {
    question: "What does a typical engagement look like?",
    answer:
      "We start with a discovery and research sprint, build a prioritized roadmap, then move into design, launch, and ongoing optimization.",
  },
  {
    question: "How quickly will I hear back?",
    answer: "We reply to every inquiry within 24 hours, Monday through Friday.",
  },
];

export interface FAQProps {
  /** Page-specific questions; falls back to the shared defaults. */
  items?: FAQItem[];
}

export function FAQ({ items = faqs }: FAQProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const entranceDelay = useEntranceDelay();

  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-8 text-center">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <Heading as="h2">
            Questions, <GradientText>answered.</GradientText>
          </Heading>
        </motion.div>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            {...fadeInUp}
            className="relative mx-auto flex h-64 w-64 items-center justify-center overflow-hidden rounded-full bg-white/5"
          >
            <Image
              src="/faq-team.jpg"
              alt="Our team ready to answer your questions about working with TFF Digital"
              fill
              sizes="256px"
              className="object-cover object-[center_10%]"
            />
          </motion.div>

          <div className="flex flex-col gap-3">
            {items.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div
                  key={faq.question}
                  {...fadeInUp}
                  transition={{
                    ...fadeInUp.transition,
                    delay: entranceDelay(index * 0.04),
                  }}
                  className="border-border-subtle bg-glass rounded-2xl border"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="focus-visible:ring-primary/50 flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left outline-none focus-visible:ring-2"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span className="font-body text-sm font-medium text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        "text-muted h-4 w-4 shrink-0 transition-transform",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  {/* Always in the DOM, collapsed via the hidden attribute
                      (display:none) rather than omitted — a conditional mount
                      left every answer but the default-open one out of the
                      server HTML entirely, invisible to any non-clicking
                      consumer, and left aria-controls pointing at IDs that
                      didn't exist (CONTENT-Q4). Tailwind preflight enforces
                      [hidden]{display:none!important}, so keep collapse on
                      this attribute — don't swap it for a display utility. */}
                  <p
                    id={`faq-answer-${index}`}
                    role="region"
                    aria-labelledby={`faq-question-${index}`}
                    hidden={!isOpen}
                    className="font-body text-muted px-5 pb-4 text-sm"
                  >
                    {faq.answer}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
