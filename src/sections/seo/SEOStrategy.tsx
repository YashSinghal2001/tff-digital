"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";

export function SEOStrategy() {
  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div
            {...fadeInUp}
            className="order-2 aspect-square w-full rounded-[25px] border border-border-strong bg-white/5 lg:order-1"
          />

          <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }} className="order-1 lg:order-2">
            <SectionEyebrow>YOU KNOW WHAT&apos;S YOUR DESTINATION</SectionEyebrow>
            <Heading as="h2">
              SEO Built Around <GradientText>Your Business Goals.</GradientText>
            </Heading>
            <p className="mt-4 font-body text-sm leading-relaxed text-muted">
              We don&apos;t start with keywords. We start with your business — your
              margins, your sales cycle, and the terms your buyers actually search when
              they&apos;re ready to act. From there we build the technical foundation,
              the content architecture, and the authority signals that turn search into a
              compounding pipeline.
            </p>
            <p className="mt-4 font-body text-sm leading-relaxed text-muted">
              Every engagement is measured against revenue and qualified pipeline — not
              rankings for keywords that don&apos;t convert.
            </p>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
