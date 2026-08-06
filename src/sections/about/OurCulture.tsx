"use client";

import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";

const perks = [
  "Remote-first across 12 countries",
  "Unlimited PTO (that we actually take)",
  "Learning stipend + annual offsite",
  "Profit-sharing for every teammate",
];

export function OurCulture() {
  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div {...fadeInUp}>
            <SectionEyebrow>OUR CULTURE</SectionEyebrow>
            <Heading as="h2">
              <GradientText>Ambitious, kind,</GradientText> and unusually honest.
            </Heading>
            <p className="mt-4 font-body text-sm leading-relaxed text-muted">
              We hire operators who care more about outcomes than optics, and who treat
              every client engagement like it&apos;s their own company. Remote-first,
              async by default, in-person a few times a year for the moments that matter.
            </p>
            <ul className="mt-6 flex flex-col gap-2">
              {perks.map((perk) => (
                <li key={perk} className="font-body text-sm text-white/80">
                  • {perk}
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
            className="aspect-[4/3] w-full rounded-[25px] border border-border-strong bg-white/5"
          />
        </div>
      </Container>
    </section>
  );
}
