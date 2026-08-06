"use client";

import { motion } from "framer-motion";
import {
  HeartPulse,
  GraduationCap,
  Dumbbell,
  Building2,
  Cpu,
  Scale,
  ShoppingCart,
  Rocket,
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { FeatureGrid } from "@/components/common/FeatureGrid";
import { fadeInUp } from "@/styles/animations";

const industries = [
  { icon: HeartPulse, title: "Healthcare" },
  { icon: GraduationCap, title: "Education" },
  { icon: Dumbbell, title: "Fitness" },
  { icon: Building2, title: "Real Estate" },
  { icon: Cpu, title: "Technology" },
  { icon: Scale, title: "Legal" },
  { icon: ShoppingCart, title: "E-commerce" },
  { icon: Rocket, title: "Startups" },
];

export function Industries() {
  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12 text-center">
          <SectionEyebrow>INDUSTRIES</SectionEyebrow>
          <Heading as="h2">
            Growth systems for <GradientText>every field.</GradientText>
          </Heading>
        </motion.div>

        <FeatureGrid
          items={industries}
          variant="compact"
          gridClassName="grid-cols-2 sm:grid-cols-4"
          gap="gap-4"
          staggerColumns={4}
          staggerStep={0.03}
        />
      </Container>
    </section>
  );
}
