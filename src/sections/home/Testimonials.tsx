"use client";

import { motion } from "framer-motion";
import { Star, User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";

const testimonials = [
  {
    quote:
      "They didn't just redesign our site — they rebuilt our entire growth engine. Revenue is up 3x in nine months.",
    name: "Sarah Liu",
    title: "CMO, Cascade Health",
  },
  {
    quote:
      "The strategy-first approach changed how we think about marketing. Every dollar now has a clear line to revenue.",
    name: "Marcus Reyes",
    title: "Founder, Halcyon",
  },
  {
    quote:
      "Finally an agency that ships fast without cutting corners on brand. Our pipeline has never looked better.",
    name: "Priya Nair",
    title: "VP Growth, Northfield",
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="text-center">
          <SectionEyebrow>TESTIMONIALS</SectionEyebrow>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: index * 0.05 }}
            >
              <Card className="flex h-full flex-col gap-4">
                <div className="flex gap-1 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <p className="font-body text-sm text-white/90">&ldquo;{testimonial.quote}&rdquo;</p>
                <div className="mt-auto flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
                    <User className="h-4 w-4 text-white/40" />
                  </span>
                  <div>
                    <p className="font-heading text-sm font-semibold text-white">{testimonial.name}</p>
                    <p className="font-body text-xs text-muted">{testimonial.title}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
