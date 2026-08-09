"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { FeatureGrid, type FeatureGridItem } from "@/components/common/FeatureGrid";
import { ROUTES } from "@/constants/routes";
import { fadeInUp } from "@/styles/animations";
import { getServiceIcon } from "@/lib/content/service-icons";
import type { ServiceOffering } from "@/types/domain/service-offering";

interface WhatWeDoProps {
  services: ServiceOffering[];
}

const FEATURE_IMAGES: Record<number, { src: string; alt: string }> = {
  0: {
    src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/f1-1.jpg",
    alt: "Team collaborating on a client growth strategy",
  },
  1: {
    src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/f2.jpg",
    alt: "Performance dashboard showing campaign growth results",
  },
};

export function WhatWeDo({ services }: WhatWeDoProps) {
  const items: FeatureGridItem[] = services.map((service, index) => ({
    icon: getServiceIcon(service.slug),
    title: service.title,
    description: service.summary,
    href: ROUTES.service(service.slug),
    image: FEATURE_IMAGES[index],
  }));

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

        <FeatureGrid items={items} titleClassName="text-lg" />
      </Container>
    </section>
  );
}
