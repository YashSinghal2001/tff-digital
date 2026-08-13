"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { UpworkIcon } from "@/components/icons/UpworkIcon";
import { TestimonialSlider } from "@/components/testimonials/TestimonialSlider";
import { testimonials } from "@/data/testimonials";
import { fadeInUp } from "@/styles/animations";

export function Testimonials() {
  return (
    <section id="testimonials" className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div
          {...fadeInUp}
          className="mx-auto mb-10 max-w-2xl text-center"
        >
          <SectionEyebrow>CLIENT FEEDBACK</SectionEyebrow>
          <Heading as="h2">
            What our <GradientText>clients say.</GradientText>
          </Heading>
          <p className="font-body text-muted mx-auto mt-4 max-w-md text-sm">
            Real feedback from businesses we&apos;ve helped grow through
            strategy, SEO, marketing, and digital execution.
          </p>
        </motion.div>

        <motion.div {...fadeInUp} className="mb-12 flex justify-center">
          <span className="border-border-strong bg-glass font-body text-muted inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs">
            <UpworkIcon className="h-3.5 w-3.5 text-[#14A800]" />
            Real feedback from Upwork projects
          </span>
        </motion.div>

        <motion.div {...fadeInUp}>
          <TestimonialSlider testimonials={testimonials} />
        </motion.div>
      </Container>
    </section>
  );
}
