"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";

const stats = [
  { value: "210+", label: "Brands scaled" },
  { value: "$480M+", label: "Revenue influenced" },
  { value: "40+", label: "Senior operators" },
  { value: "94%", label: "Retention" },
];

export function OurStory() {
  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          <motion.div {...fadeInUp}>
            <SectionEyebrow>OUR STORY</SectionEyebrow>
            <Heading as="h2">
              Most agencies sell time. <GradientText>We sell outcomes.</GradientText>
            </Heading>
            <p className="mt-4 font-body text-sm leading-relaxed text-muted">
              After a decade running in-house growth teams, our founders got tired of
              watching agencies sell hours instead of outcomes. So they built the agency
              they wished existed — senior-led, outcome-obsessed, and unafraid to say what
              most agencies won&apos;t. We&apos;re now 40+ operators strong, spanning nine
              disciplines, working with venture-backed startups through mid-market brands
              across four continents.
            </p>
          </motion.div>

          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            {stats.map((stat) => (
              <Card key={stat.label}>
                <p className="font-heading text-2xl font-bold text-white">{stat.value}</p>
                <p className="mt-1 font-body text-sm text-muted">{stat.label}</p>
              </Card>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
