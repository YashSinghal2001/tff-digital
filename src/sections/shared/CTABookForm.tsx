"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { GradientText } from "@/components/ui/GradientText";
import { ContactForm } from "@/features/contact/ContactForm";
import { fadeInUp } from "@/styles/animations";

export function CTABookForm() {
  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-center lg:gap-12">
          <motion.div {...fadeInUp}>
            <h2 className="font-heading text-[32px] font-bold leading-tight text-white sm:text-[40px]">
              Let&apos;s build your next <GradientText>digital success story.</GradientText>
            </h2>
            <p className="mt-4 max-w-md font-body text-sm text-muted">
              Book a free strategy call and get a clear, actionable growth roadmap — no
              obligation.
            </p>
          </motion.div>

          <motion.div {...fadeInUp} transition={{ ...fadeInUp.transition, delay: 0.1 }}>
            <ContactForm />
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
