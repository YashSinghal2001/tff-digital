"use client";

import { motion } from "framer-motion";
import { CircleX, CircleCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";

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
  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12 text-center">
          <SectionEyebrow>WHY TARGET FIND FINISH</SectionEyebrow>
          <Heading as="h2">
            The difference is <GradientText>strategy.</GradientText>
          </Heading>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div {...fadeInUp}>
            <Card>
              <h3 className="font-heading text-sm font-bold tracking-wide text-muted">
                TYPICAL AGENCIES
              </h3>
              <ul className="mt-5 flex flex-col gap-4">
                {typical.map((item) => (
                  <li key={item} className="flex items-start gap-3 font-body text-sm text-muted">
                    <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-white/30" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>

          <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }}>
            <Card className="border-primary/40">
              <h3 className="font-heading text-sm font-bold tracking-wide text-white">
                TARGET FIND FINISH DIGITAL
              </h3>
              <ul className="mt-5 flex flex-col gap-4">
                {tff.map((item) => (
                  <li key={item} className="flex items-start gap-3 font-body text-sm text-white">
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
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
