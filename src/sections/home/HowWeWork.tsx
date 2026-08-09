"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";
import { cn } from "@/lib/utils";

const steps = [
  { step: "01", title: "Discover", description: "Deep dive into your business, goals, and constraints." },
  { step: "02", title: "Research", description: "Market, competitor, and audience intelligence." },
  { step: "03", title: "Strategy", description: "A clear, prioritized roadmap to growth." },
  { step: "04", title: "Design", description: "Brand and experiences crafted to convert." },
  { step: "05", title: "Launch", description: "Ship fast, measure everything." },
  { step: "06", title: "Scale", description: "Double down on what compounds." },
];

export function HowWeWork() {
  return (
    <section id="process" className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12">
          <SectionEyebrow>HOW WE WORK</SectionEyebrow>
          <Heading as="h2">
            A proven <GradientText>six-step</GradientText> growth engine.
          </Heading>
        </motion.div>

        <div className="relative">
          <div className="absolute left-2 top-6 bottom-6 w-px bg-border-subtle lg:left-1/2 lg:-translate-x-1/2" />
          <div className="flex flex-col gap-6">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                {...fadeInUp}
                transition={{ ...fadeInUp.transition, delay: index * 0.05 }}
                className="relative flex items-center gap-4 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-8"
              >
                <div className="flex w-4 shrink-0 justify-center lg:col-start-2 lg:w-10">
                  <span className="relative z-10 h-3.5 w-3.5 shrink-0 rounded-full bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)] shadow-[var(--shadow-glow)] ring-4 ring-background" />
                </div>
                <Card className={cn("flex-1", index % 2 === 1 ? "lg:col-start-3" : "lg:col-start-1")}>
                  <p className="font-body text-xs font-semibold tracking-wide text-primary">
                    Step {item.step}
                  </p>
                  <h3 className="mt-1 font-heading text-lg font-bold text-white">{item.title}</h3>
                  <p className="mt-1 font-body text-sm text-muted">{item.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
