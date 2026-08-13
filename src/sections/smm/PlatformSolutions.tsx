"use client";

import { motion } from "framer-motion";
import { Camera, Users, Briefcase, Play, Pin, Send } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { FeatureGrid } from "@/components/common/FeatureGrid";
import { fadeInUp } from "@/styles/animations";

const platforms = [
  { icon: Camera, title: "Instagram Marketing", description: "Visual storytelling that builds an engaged, loyal community." },
  { icon: Users, title: "Facebook Marketing", description: "Community-building and precision-targeted ad campaigns." },
  { icon: Briefcase, title: "LinkedIn Marketing", description: "B2B authority-building and qualified lead generation." },
  { icon: Play, title: "YouTube Marketing", description: "Long-form and short-form video built to retain attention." },
  { icon: Pin, title: "Pinterest Marketing", description: "Discovery-driven traffic for visually-led brands." },
  { icon: Send, title: "X (Twitter) Marketing", description: "Real-time engagement and brand voice at speed." },
];

export function PlatformSolutions() {
  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12">
          <SectionEyebrow>SOCIAL MEDIA MANAGEMENT SERVICES</SectionEyebrow>
          <Heading as="h2">
            Our Social Media <GradientText>Solutions Designed for Your Business.</GradientText>
          </Heading>
          <p className="mt-4 max-w-2xl font-body text-sm text-muted">
            Every social platform serves a different purpose — and your strategy should
            reflect that. Success isn&apos;t about being active everywhere; it&apos;s
            about showing up where your audience is and delivering in the right format.
          </p>
        </motion.div>

        <FeatureGrid items={platforms} />
      </Container>
    </section>
  );
}
