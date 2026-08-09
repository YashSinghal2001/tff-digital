"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { ThreePartJourney } from "@/sections/shared/ThreePartJourney";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";

const founders = [
  {
    name: "Raju Gorai",
    role: "Position",
    bio: "Former growth lead at two IPO'd SaaS companies.",
    image: {
      src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/hero.jpg",
      alt: "Raju Gorai",
    },
  },
  {
    name: "Kanchan Rana",
    role: "Position",
    bio: "Former growth lead at two IPO'd SaaS companies.",
    image: {
      src: "https://cms.tffdigital.com/wp-content/uploads/2026/08/f1-1.jpg",
      alt: "Kanchan Rana",
    },
  },
];

export function AboutJourney() {
  return (
    <section id="about" className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12 text-center">
          <SectionEyebrow>ABOUT US</SectionEyebrow>
          <Heading as="h2">
            Built by <GradientText>growth leaders,</GradientText> for{" "}
            <GradientText>growth leaders.</GradientText>
          </Heading>
        </motion.div>

        <div className="mb-16 grid gap-6 sm:grid-cols-2">
          {founders.map((founder) => (
            <motion.div key={founder.name} {...fadeInUp}>
              <div className="flex h-full flex-col overflow-hidden rounded-[25px] border border-border-strong bg-glass">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-white/5">
                  <Image
                    src={founder.image.src}
                    alt={founder.image.alt}
                    fill
                    sizes="(max-width: 640px) 100vw, 50vw"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col items-center gap-2 p-6 text-center">
                  <h3 className="font-heading text-lg font-bold text-white">{founder.name}</h3>
                  <p className="font-body text-sm font-medium text-primary">{founder.role}</p>
                  <p className="font-body text-sm text-muted">{founder.bio}</p>
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
