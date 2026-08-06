"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { GradientText } from "@/components/ui/GradientText";
import { Heading } from "@/components/ui/Heading";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How is Target Find Finish different from other agencies?",
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

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12 text-center">
          <SectionEyebrow>FAQ</SectionEyebrow>
          <Heading as="h2">
            Questions, <GradientText>answered.</GradientText>
          </Heading>
        </motion.div>

        <div className="grid items-center gap-10 lg:grid-cols-2">
          <motion.div
            {...fadeInUp}
            className="mx-auto flex h-64 w-64 items-center justify-center rounded-full bg-white/5"
          >
            <User className="h-24 w-24 text-white/20" strokeWidth={1} />
          </motion.div>

          <div className="flex flex-col gap-3">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <motion.div
                  key={faq.question}
                  {...fadeInUp}
                  transition={{ ...fadeInUp.transition, delay: index * 0.04 }}
                  className="rounded-2xl border border-border-subtle bg-glass"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    className="flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${index}`}
                    id={`faq-question-${index}`}
                  >
                    <span className="font-body text-sm font-medium text-white">
                      {faq.question}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 shrink-0 text-muted transition-transform",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen ? (
                    <p
                      id={`faq-answer-${index}`}
                      role="region"
                      aria-labelledby={`faq-question-${index}`}
                      className="px-5 pb-4 font-body text-sm text-muted"
                    >
                      {faq.answer}
                    </p>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
