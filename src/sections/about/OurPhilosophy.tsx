"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { ThreePartJourney } from "@/sections/shared/ThreePartJourney";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";

export function OurPhilosophy() {
  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12">
          <SectionEyebrow>OUR PHILOSOPHY</SectionEyebrow>
          <Heading as="h2">
            A three-part journey from <GradientText>insight to impact.</GradientText>
          </Heading>
        </motion.div>

        <ThreePartJourney />
      </Container>
    </section>
  );
}
