"use client";

import { motion } from "framer-motion";
import { Zap, Shield, Rocket, TrendingUp } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { FeatureGrid } from "@/components/common/FeatureGrid";
import { fadeInUp } from "@/styles/animations";

const points = [
  {
    icon: Zap,
    title: "Ship in weeks, not quarters",
    description: "Small, consistent, excellent — the only way growth actually works.",
  },
  {
    icon: Shield,
    title: "Radical transparency",
    description: "Live dashboards, honest reporting.",
  },
  {
    icon: Rocket,
    title: "Compounding growth",
    description: "Strategies that pay dividends for years.",
  },
  {
    icon: TrendingUp,
    title: "Tied to revenue",
    description: "We only measure what moves the P&L.",
  },
];

export function WhySeniorLed() {
  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div {...fadeInUp}>
            <SectionEyebrow>WHY TARGET FIND FINISH</SectionEyebrow>
            <Heading as="h2">
              <GradientText>Senior-led.</GradientText> Outcome-obsessed. Zero fluff.
            </Heading>
            <p className="mt-4 font-body text-sm leading-relaxed text-muted">
              We don&apos;t hand you off to juniors. Every account is led by an operator
              with a decade of experience and the capability to match.
            </p>
          </motion.div>

          <FeatureGrid
            items={points}
            gridClassName="sm:grid-cols-2"
            staggerColumns={2}
            iconSize="sm"
            cardGap="gap-3"
          />
        </div>
      </Container>
    </section>
  );
}
