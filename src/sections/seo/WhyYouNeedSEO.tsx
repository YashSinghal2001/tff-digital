"use client";

import { motion } from "framer-motion";
import { Wrench, FileSearch, Link2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { FeatureGrid } from "@/components/common/FeatureGrid";
import { fadeInUp } from "@/styles/animations";

const points = [
  {
    icon: Wrench,
    title: "Technical Audits",
    description: "Comprehensive site audits that find and fix what's blocking your rankings.",
  },
  {
    icon: FileSearch,
    title: "Content That Ranks",
    description: "Search-intent-driven content that earns rankings and trust.",
  },
  {
    icon: Link2,
    title: "Authority Building",
    description: "Link building and digital PR that compounds your domain authority.",
  },
];

export function WhyYouNeedSEO() {
  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12">
          <SectionEyebrow>WHY YOUR BUSINESS NEEDS SEO</SectionEyebrow>
          <Heading as="h2">Built to rank, and to last.</Heading>
        </motion.div>

        <FeatureGrid items={points} gridClassName="sm:grid-cols-3" staggerColumns={3} />
      </Container>
    </section>
  );
}
