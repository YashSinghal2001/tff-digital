"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { ThreePartJourney } from "@/sections/shared/ThreePartJourney";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";

const founders = [
  { name: "Rahul Sharma", role: "Co-Founder & CEO" },
  { name: "Sneha Kapoor", role: "Co-Founder & CSO" },
];

export function AboutJourney() {
  return (
    <section id="about" className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12 text-center">
          <SectionEyebrow>ABOUT US</SectionEyebrow>
          <Heading as="h2">
            Built by <GradientText>growth leaders,</GradientText> for{" "}
            <GradientText>growth leaders.</GradientText>
          </Heading>
        </motion.div>

        <div className="mb-16 grid gap-6 sm:grid-cols-2">
          {founders.map((founder) => (
            <motion.div key={founder.name} {...fadeInUp}>
              <Card className="flex flex-col items-center gap-3 text-center">
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-white/5">
                  <User className="h-8 w-8 text-white/30" strokeWidth={1} />
                </span>
                <h3 className="font-heading text-base font-bold text-white">{founder.name}</h3>
                <p className="font-body text-sm text-muted">{founder.role}</p>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.p {...fadeInUp} className="mb-8 font-heading text-lg font-bold text-white">
          A three-part journey from insight to impact.
        </motion.p>

        <ThreePartJourney />
      </Container>
    </section>
  );
}
