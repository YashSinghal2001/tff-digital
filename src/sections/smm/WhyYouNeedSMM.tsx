"use client";

import { motion } from "framer-motion";
import { Target, ChartBar, Image as ImageIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { FeatureGrid } from "@/components/common/FeatureGrid";
import { fadeInUp } from "@/styles/animations";

const points = [
  {
    icon: Target,
    title: "Targeted Ad Campaigns",
    description: "Targeted campaigns that generate leads and increase conversions.",
  },
  {
    icon: ChartBar,
    title: "Transparent Reporting",
    description: "Transparent reports showing performance, engagement, and ROI.",
  },
  {
    icon: ImageIcon,
    title: "Scroll-Stopping Creative",
    description: "Professional visuals designed to stop scrolling and capture attention.",
  },
];

export function WhyYouNeedSMM() {
  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12">
          <SectionEyebrow>WHY YOUR BUSINESS NEEDS SMM</SectionEyebrow>
          <Heading as="h2">Built to be seen, and to convert.</Heading>
        </motion.div>

        <FeatureGrid items={points} gridClassName="sm:grid-cols-3" staggerColumns={3} />
      </Container>
    </section>
  );
}
