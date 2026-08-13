"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Briefcase, Search, Target, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { IconCircle } from "@/components/ui/IconCircle";
import { ThreePartJourney } from "@/sections/shared/ThreePartJourney";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";

interface FounderHighlight {
  icon: LucideIcon;
  value: string;
  detail: string;
}

const founders: Array<{
  eyebrow: string;
  name: string;
  role: string;
  image: { src: string; alt: string };
  highlights: FounderHighlight[];
}> = [
  {
    eyebrow: "CO-FOUNDER",
    name: "Raju Gorai",
    role: "Performance Marketing Expert",
    image: {
      src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/f1-1.jpg",
      alt: "Raju Gorai",
    },
    highlights: [
      {
        icon: Briefcase,
        value: "10+",
        detail: "Years of Experience in Performance Marketing",
      },
      {
        icon: Target,
        value: "Specialized In",
        detail: "Paid Media, PPC, ROI Optimization, Growth Strategy",
      },
    ],
  },
  {
    eyebrow: "CO-FOUNDER",
    name: "Kanchan Rana",
    role: "SEO & Organic Growth Expert",
    image: {
      src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/f2.jpg",
      alt: "Kanchan Rana",
    },
    highlights: [
      {
        icon: Search,
        value: "12+",
        detail: "Years of Experience in SEO",
      },
      {
        icon: TrendingUp,
        value: "Specialized In",
        detail: "SEO Strategy, Technical SEO, Content, Organic Growth",
      },
    ],
  },
];

export function AboutJourney() {
  return (
    <section id="about" className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mx-auto mb-8 max-w-2xl text-center">
          <SectionEyebrow>ABOUT US</SectionEyebrow>
          <Heading as="h2">
            Built by <GradientText>growth leaders,</GradientText> for{" "}
            <GradientText>growth leaders.</GradientText>
          </Heading>
          <p className="mx-auto mt-4 max-w-md font-body text-sm text-muted">
            Experienced. Focused. Results-driven. We lead with strategy and execute with
            precision to deliver measurable growth.
          </p>
        </motion.div>

        <div className="mb-10 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {founders.map((founder) => (
            <motion.div key={founder.name} {...fadeInUp} className="h-full">
              <div className="group h-full rounded-[25px] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_35%,transparent),color-mix(in_srgb,var(--color-secondary)_35%,transparent))] p-px transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                <div className="flex h-full flex-col rounded-[25px] bg-[color-mix(in_srgb,var(--color-background)_94%,#ffffff)] p-6 transition-shadow duration-200 group-hover:shadow-[0_0_36px_0_rgba(56,130,246,0.16)] sm:p-8">
                  <div className="flex flex-1 flex-col items-center gap-6 text-center sm:flex-row sm:gap-8 sm:text-left">
                    <div className="relative w-44 shrink-0 sm:w-[42%] sm:max-w-[240px]">
                      <div
                        aria-hidden="true"
                        className="absolute -inset-3 rounded-full bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_35%,transparent),color-mix(in_srgb,var(--color-secondary)_35%,transparent))] opacity-60 blur-2xl transition-opacity duration-200 group-hover:opacity-80"
                      />
                      <div className="relative aspect-square overflow-hidden rounded-full border border-border-strong bg-white/5">
                        <Image
                          src={founder.image.src}
                          alt={founder.image.alt}
                          fill
                          sizes="(max-width: 640px) 176px, 240px"
                          className="object-cover object-top"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2 sm:items-start">
                      <p className="font-body text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                        {founder.eyebrow}
                      </p>
                      <h3 className="font-heading text-[28px] font-bold leading-[1.15] text-white sm:text-[32px]">
                        {founder.name.split(" ").map((part) => (
                          <span key={part} className="block">
                            {part}
                          </span>
                        ))}
                      </h3>
                      <p className="font-body text-sm font-semibold text-muted">
                        {founder.role}
                      </p>
                    </div>
                  </div>

                  <div className="mt-8 border-t border-border-subtle pt-6">
                    <div className="grid grid-cols-1 gap-6 min-[400px]:grid-cols-2">
                      {founder.highlights.map((highlight) => (
                        <div
                          key={highlight.value}
                          className="flex flex-col items-center gap-3 text-center sm:items-start sm:text-left"
                        >
                          <IconCircle
                            icon={highlight.icon}
                            size="md"
                            className="shadow-[0_0_18px_0_rgba(56,130,246,0.2)]"
                          />
                          <p className="font-heading text-lg font-bold text-white">
                            {highlight.value}
                          </p>
                          <p className="font-body text-sm text-muted">{highlight.detail}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.p {...fadeInUp} className="mb-8 font-heading text-lg font-bold text-white">
          A three-part journey from insight to impact.
        </motion.p>

        <ThreePartJourney />
      </Container>
    </section>
  );
}
