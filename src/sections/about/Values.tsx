"use client";

import { motion } from "framer-motion";
import { Shield, Zap, Users, Layers } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { FeatureGrid } from "@/components/common/FeatureGrid";
import { fadeInUp } from "@/styles/animations";

const values = [
  {
    icon: Shield,
    title: "Integrity first",
    description: "We tell clients the truth — even when it costs us the account.",
  },
  {
    icon: Zap,
    title: "Bias to action",
    description: "We ship, learn, iterate. Perfection is the enemy of momentum.",
  },
  {
    icon: Users,
    title: "Client as partner",
    description: "Your wins are our wins. We think like owners, not vendors.",
  },
  {
    icon: Layers,
    title: "Compounding effort",
    description: "Small, consistent, smart bets — that's how growth actually works.",
  },
];

export function Values() {
  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12">
          <SectionEyebrow>VALUES</SectionEyebrow>
          <Heading as="h2">What we stand for.</Heading>
        </motion.div>

        <FeatureGrid items={values} gridClassName="sm:grid-cols-2 lg:grid-cols-4" staggerColumns={4} />
      </Container>
    </section>
  );
}
