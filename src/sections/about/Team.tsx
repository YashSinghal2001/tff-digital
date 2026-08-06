"use client";

import { motion } from "framer-motion";
import { User } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";

const team = Array.from({ length: 4 }, () => ({
  name: "Name",
  position: "Position",
  bio: "Former growth lead at two IPO'd SaaS companies.",
}));

export function Team() {
  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mb-12">
          <SectionEyebrow>TEAM</SectionEyebrow>
          <Heading as="h2">
            Meet the <GradientText>operators.</GradientText>
          </Heading>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member, index) => (
            <motion.div
              key={index}
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: index * 0.05 }}
            >
              <Card className="flex flex-col items-center gap-3 text-center">
                <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/5">
                  <User className="h-10 w-10 text-white/30" strokeWidth={1} />
                </span>
                <h3 className="font-heading text-base font-bold text-white">{member.name}</h3>
                <p className="font-body text-xs font-semibold text-primary">{member.position}</p>
                <p className="font-body text-sm text-muted">{member.bio}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
