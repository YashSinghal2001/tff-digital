"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { buttonVariants } from "@/components/ui/button-variants";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { TeamCarousel } from "@/components/team/TeamCarousel";
import { teamMembers } from "@/data/team";
import { ROUTES } from "@/constants/routes";
import { fadeInUp } from "@/styles/animations";

export function Team() {
  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-8 lg:mb-10">
          <SectionEyebrow>OUR TEAM</SectionEyebrow>
          <Heading as="h2">
            Meet the people behind <GradientText>the growth.</GradientText>
          </Heading>
          <p className="font-heading mt-4 text-sm font-semibold tracking-wide text-white/90">
            Strategy-led. Data-driven. Growth-focused.
          </p>
          <p className="font-body text-muted mt-2 max-w-2xl text-sm leading-relaxed">
            The people behind the work — experienced, collaborative, and ready
            to make an impact.
          </p>
        </motion.div>

        <motion.div {...fadeInUp}>
          <TeamCarousel members={teamMembers} />
        </motion.div>

        {/* Compact closing beat from the deck's final page — deliberately not
            another full CTA band (WhyTFF/FAQ already close the page). */}
        <motion.div {...fadeInUp} className="mt-12 text-center lg:mt-14">
          <Heading as="h4">
            Let&apos;s <GradientText>work together.</GradientText>
          </Heading>
          <p className="font-body text-muted mx-auto mt-3 max-w-xl text-sm leading-relaxed">
            Follow along to meet the people behind our ideas, or reach out to
            start a conversation.
          </p>
          <div className="mt-6">
            <Link
              href={ROUTES.contact}
              className={buttonVariants({ variant: "primary", size: "md" })}
            >
              Let&apos;s connect
            </Link>
          </div>
          <p className="font-body text-muted/80 mt-3 text-xs">
            We&apos;d love to hear from you.
          </p>
        </motion.div>
      </Container>
    </section>
  );
}
