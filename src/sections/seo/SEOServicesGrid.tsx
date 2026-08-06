"use client";

import { motion } from "framer-motion";
import { Wrench, FileText, Link2, MapPinned, ChartBar, Gauge } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { FeatureGrid } from "@/components/common/FeatureGrid";
import { fadeInUp } from "@/styles/animations";

const services = [
  { icon: Wrench, title: "Technical SEO", description: "Site speed, crawlability, and indexation fixed at the source." },
  { icon: FileText, title: "On-Page SEO", description: "Content and metadata engineered around real search intent." },
  { icon: Link2, title: "Link Building", description: "Editorial links and digital PR that compound domain authority." },
  { icon: MapPinned, title: "Local SEO", description: "Own the map pack and local pack for every service area you serve." },
  { icon: ChartBar, title: "Content Strategy", description: "Topic clusters and content calendars mapped to the buyer journey." },
  { icon: Gauge, title: "Reporting & Analytics", description: "Rankings, traffic, and revenue attribution in one clear dashboard." },
];

export function SEOServicesGrid() {
  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12">
          <SectionEyebrow>SEARCH ENGINE OPTIMIZATION SERVICES</SectionEyebrow>
          <Heading as="h2">
            Our SEO <GradientText>Solutions Designed for Your Business.</GradientText>
          </Heading>
        </motion.div>

        <FeatureGrid items={services} />
      </Container>
    </section>
  );
}
