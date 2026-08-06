"use client";

import { motion } from "framer-motion";
import { ArrowUpRight, Building2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { Badge } from "@/components/ui/Badge";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { fadeInUp } from "@/styles/animations";

const projects = [
  { client: "Cascade Health", stat: "+287% organic traffic" },
  { client: "Cascade Health", stat: "6.4x ROAS" },
];

export function SelectedWork() {
  return (
    <section id="work" className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div
          {...fadeInUp}
          className="mb-12 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"
        >
          <div>
            <SectionEyebrow>SELECTED WORK</SectionEyebrow>
            <Heading as="h2">
              Growth, <GradientText>made visible.</GradientText>
            </Heading>
          </div>
          <p className="max-w-xs font-body text-sm text-muted">
            A glimpse at the systems we&apos;ve built and the results they&apos;ve earned.
          </p>
        </motion.div>

        <div className="grid gap-6 sm:grid-cols-2">
          {projects.map((project, index) => (
            <motion.div
              key={`${project.client}-${index}`}
              {...fadeInUp}
              transition={{ ...fadeInUp.transition, delay: index * 0.05 }}
              className="group relative flex h-72 flex-col justify-end overflow-hidden rounded-[25px] border border-border-strong bg-white/5 p-6"
            >
              <Building2 className="absolute right-6 top-6 h-10 w-10 text-white/10" strokeWidth={1} />
              <Badge className="mb-3 w-fit" tone="info">
                {project.stat}
              </Badge>
              <div className="flex items-center justify-between">
                <p className="font-heading text-lg font-bold text-white">{project.client}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="h-4 w-4" />
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
