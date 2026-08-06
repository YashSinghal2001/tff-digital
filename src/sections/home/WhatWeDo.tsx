"use client";

import { motion } from "framer-motion";
import { TrendingUp, Megaphone, Search, Palette, CodeXml } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { FeatureGrid } from "@/components/common/FeatureGrid";
import { ROUTES } from "@/constants/routes";
import { fadeInUp } from "@/styles/animations";

const services = [
  { icon: TrendingUp, title: "CRO", description: "Turn traffic into revenue.", href: ROUTES.services },
  {
    icon: Megaphone,
    title: "Google & Meta Ads",
    description: "Profitable paid acquisition at scale.",
    href: ROUTES.services,
  },
  {
    icon: Search,
    title: "SEO",
    description: "Rank for what your buyers actually search.",
    href: ROUTES.service("seo"),
  },
  {
    icon: Palette,
    title: "Branding",
    description: "Distinct, ownable visual identity systems.",
    href: ROUTES.services,
  },
  {
    icon: CodeXml,
    title: "Website Design & Development",
    description: "Fast, conversion-focused builds.",
    href: ROUTES.services,
  },
];

export function WhatWeDo() {
  return (
    <section id="services" className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div
          {...fadeInUp}
          className="mb-12 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"
        >
          <div>
            <SectionEyebrow>WHAT WE DO</SectionEyebrow>
            <Heading as="h2">
              A full growth stack, <GradientText>under one roof.</GradientText>
            </Heading>
          </div>
          <p className="max-w-xs font-body text-sm text-muted">
            Sixteen disciplines, one integrated system — engineered to move a single
            metric: your growth.
          </p>
        </motion.div>

        <FeatureGrid items={services} titleClassName="text-lg" />
      </Container>
    </section>
  );
}
