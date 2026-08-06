"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";

export function DestinationStrategy() {
  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div {...fadeInUp}>
            <SectionEyebrow>YOU KNOW WHAT&apos;S YOUR DESTINATION</SectionEyebrow>
            <Heading as="h2">
              Social Media Management Services That&apos;re{" "}
              <GradientText>Made Just For You</GradientText>
            </Heading>
            <p className="mt-4 font-body text-sm leading-relaxed text-muted">
              Every successful campaign begins with understanding the destination.
              That&apos;s why we don&apos;t start by creating content — we start by
              understanding your business. We analyze your audience, evaluate your
              current performance, and uncover the opportunities that can drive
              meaningful growth.
            </p>
            <p className="mt-4 font-body text-sm leading-relaxed text-muted">
              Using our Target · Find · Finish framework, we craft a tailored strategy
              that aligns with your brand, reaches the right audience, and transforms
              social media into a scalable growth channel. From strategic planning and
              creative production to campaign management and continuous optimization,
              every step is designed to deliver measurable business outcomes — not just
              likes or more followers.
            </p>
          </motion.div>

          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
            className="aspect-square w-full rounded-[25px] border border-border-strong bg-white/5"
          />
        </div>
      </Container>
    </section>
  );
}
