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

/** Culture spotlight is deliberately Kanchan + Raju only — not the full team. */
const cultureSpotlight = teamMembers.filter(
  (member) => member.id === "kanchan" || member.id === "raju",
);

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

          {/* Founder spotlight (Kanchan + Raju only): two equal portrait
              cards, same glass container language as TeamMemberCard
              (bg-glass, border-border-strong, rounded-[25px], hover lift
              + glow) — stacked on mobile, side by side from sm up. */}
          <motion.div
            {...fadeInUp}
            transition={{ ...fadeInUp.transition, delay: entranceDelay(0.1) }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            {cultureSpotlight.map((member) => (
              <div
                key={member.id}
                className="group bg-glass border-border-strong hover:border-primary/60 relative flex h-full flex-col overflow-hidden rounded-[25px] border transition-all duration-300 hover:z-10 hover:-translate-y-1 hover:shadow-[0_0_36px_0_rgba(56,130,246,0.16)] motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-[color-mix(in_srgb,var(--color-background)_82%,#000000)]">
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[radial-gradient(120%_85%_at_50%_28%,color-mix(in_srgb,var(--color-primary)_18%,transparent)_0%,transparent_62%)]"
                  />
                  <Image
                    src={member.image.src}
                    alt={member.image.alt}
                    fill
                    sizes="(min-width: 1024px) 280px, 45vw"
                    className="object-cover object-top transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-heading text-lg font-bold text-white">
                    {member.name}
                  </h3>
                  <p className="font-body text-muted mt-1 text-sm font-semibold">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
