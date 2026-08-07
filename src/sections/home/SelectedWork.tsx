"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Building2 } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { Badge } from "@/components/ui/Badge";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { EmptyState } from "@/components/common/EmptyState";
import { ROUTES } from "@/constants/routes";
import { fadeInUp } from "@/styles/animations";
import type { CaseStudy } from "@/types/domain/case-study";

export interface SelectedWorkProps {
  caseStudies: CaseStudy[];
}

export function SelectedWork({ caseStudies }: SelectedWorkProps) {
  // Keeps id="work" alive even with zero featured case studies, so the
  // Navbar's /#work anchor always resolves to something — an honest empty
  // state instead of hiding the section (and the anchor with it).
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

        {caseStudies.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Case studies coming soon"
            description="We're publishing our first client results shortly — check back soon."
          />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            {caseStudies.map((caseStudy, index) => {
              const headlineResult = caseStudy.results[0];
              const clientLabel = caseStudy.clientName || caseStudy.title;

              return (
                <motion.div
                  key={caseStudy.id}
                  {...fadeInUp}
                  transition={{ ...fadeInUp.transition, delay: index * 0.05 }}
                  className="group relative flex h-72 flex-col justify-end overflow-hidden rounded-[25px] border border-border-strong bg-white/5 p-6"
                >
                  <Link
                    href={ROUTES.caseStudy(caseStudy.slug)}
                    className="absolute inset-0 z-10 outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
                    aria-label={`View case study: ${clientLabel}`}
                  />
                  <Building2 className="absolute right-6 top-6 h-10 w-10 text-white/10" strokeWidth={1} />
                  {headlineResult ? (
                    <Badge className="mb-3 w-fit" tone="info">
                      {headlineResult.value} {headlineResult.label}
                    </Badge>
                  ) : null}
                  <div className="flex items-center justify-between">
                    <p className="font-heading text-lg font-bold text-white">{clientLabel}</p>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                      <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
