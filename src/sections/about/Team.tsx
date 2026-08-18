"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { TeamCarousel } from "@/components/team/TeamCarousel";
import { teamSlides } from "@/data/team";
import { fadeInUp } from "@/styles/animations";

export function Team() {
  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12">
          <SectionEyebrow>OUR TEAM</SectionEyebrow>
          <Heading as="h2">
            Meet the people behind <GradientText>the growth.</GradientText>
          </Heading>
          <p className="font-body text-muted mt-4 max-w-2xl text-sm leading-relaxed">
            Strategy, creativity, and execution don&apos;t run on autopilot —
            they&apos;re driven by operators who treat your growth like their
            own.
          </p>
        </motion.div>

        <motion.div {...fadeInUp}>
          <TeamCarousel slides={teamSlides} />
        </motion.div>
      </Container>
    </section>
  );
}
