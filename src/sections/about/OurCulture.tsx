"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { teamMembers } from "@/data/team";
import { fadeInUp } from "@/styles/animations";
import { useEntranceDelay } from "@/lib/a11y/use-entrance-delay";

const perks = [
  "Remote-first across 12 countries",
  "Unlimited PTO (that we actually take)",
  "Learning stipend + annual offsite",
  "Profit-sharing for every teammate",
];

export function OurCulture() {
  const entranceDelay = useEntranceDelay();

  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <motion.div {...fadeInUp}>
            <SectionEyebrow>OUR CULTURE</SectionEyebrow>
            <Heading as="h2">
              <GradientText>Ambitious, kind,</GradientText> and unusually
              honest.
            </Heading>
            <p className="font-body text-muted mt-4 text-sm leading-relaxed">
              We hire operators who care more about outcomes than optics, and
              who treat every client engagement like it&apos;s their own
              company. Remote-first, async by default, in-person a few times a
              year for the moments that matter.
            </p>
            <ul className="mt-6 flex flex-col gap-2">
              {perks.map((perk) => (
                <li key={perk} className="font-body text-sm text-white/80">
                  • {perk}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Mosaic of the team's portraits (same assets as the Team
              carousel) on the carousel's navy stage — fills what was an
              empty placeholder panel without introducing new imagery. */}
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: entranceDelay(0.1) }}
            className="border-border-strong grid aspect-[4/3] w-full grid-cols-3 grid-rows-2 gap-2 overflow-hidden rounded-[25px] border bg-white/5 p-2"
          >
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="relative overflow-hidden rounded-xl bg-[color-mix(in_srgb,var(--color-background)_82%,#000000)]"
              >
                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_28%,color-mix(in_srgb,var(--color-primary)_18%,transparent)_0%,transparent_62%)]"
                />
                <Image
                  src={member.image.src}
                  alt={member.image.alt}
                  fill
                  sizes="(min-width: 1024px) 200px, 30vw"
                  className="object-cover object-top"
                />
              </div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
