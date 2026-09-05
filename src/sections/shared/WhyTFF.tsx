"use client";

import { motion } from "framer-motion";
import { CircleX, CircleCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";
import { useEntranceDelay } from "@/lib/a11y/use-entrance-delay";

const typical = [
  "Generic, off-the-shelf marketing",
  "No underlying strategy",
  "Average, templated websites",
  "Vanity metrics, no revenue",
  "Slow, siloed communication",
];

const tff = [
  "Strategic thinking, tailored to you",
  "Premium, ownable branding",
  "High-performance custom websites",
  "Growth measured in revenue",
  "One integrated, accountable team",
];

export function WhyTFF() {
  const entranceDelay = useEntranceDelay();

  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-8 text-center">
          <SectionEyebrow>WHY TFF</SectionEyebrow>
          <Heading as="h2">
            The difference is <GradientText>strategy.</GradientText>
          </Heading>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div {...fadeInUp}>
            <Card>
              <h3 className="font-heading text-muted text-sm font-bold tracking-wide">
                TYPICAL AGENCIES
              </h3>
              <ul className="mt-5 flex flex-col gap-4">
                {typical.map((item) => (
                  <li
                    key={item}
                    className="font-body text-muted flex items-start gap-3 text-sm"
                  >
                    <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: entranceDelay(0.1) }}
          >
            <Card className="border-primary/40">
              <h3 className="font-heading text-sm font-bold tracking-wide text-white">
                TFF DIGITAL
              </h3>
              <ul className="mt-5 flex flex-col gap-4">
                {tff.map((item) => (
                  <li
                    key={item}
                    className="font-body flex items-start gap-3 text-sm text-white"
                  >
                    <CircleCheck className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
