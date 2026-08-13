"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { UpworkIcon } from "@/components/icons/UpworkIcon";
import { TestimonialCard } from "@/components/testimonials/TestimonialCard";
import { testimonials } from "@/data/testimonials";
import { fadeInUp } from "@/styles/animations";

export function Testimonials() {
  return (
    <section id="testimonials" className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mx-auto mb-10 max-w-2xl text-center">
          <SectionEyebrow>CLIENT FEEDBACK</SectionEyebrow>
          <Heading as="h2">
            What our <GradientText>clients say.</GradientText>
          </Heading>
          <p className="mx-auto mt-4 max-w-md font-body text-sm text-muted">
            Real feedback from businesses we&apos;ve helped grow through strategy, SEO,
            marketing, and digital execution.
          </p>
        </motion.div>

        <motion.div
          {...fadeInUp}
          className="mb-12 flex justify-center"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-glass px-4 py-2 font-body text-xs text-muted">
            <UpworkIcon className="h-3.5 w-3.5 text-[#14A800]" />
            Real feedback from Upwork projects
          </span>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: (index % 3) * 0.05 }}
            >
              <TestimonialCard testimonial={testimonial} />
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
