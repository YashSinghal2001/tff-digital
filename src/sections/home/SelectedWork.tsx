"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
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
import { useEntranceDelay } from "@/lib/a11y/use-entrance-delay";
import { getWebsitePreviewUrl } from "@/lib/content/website-preview";
import type { CaseStudy } from "@/types/domain/case-study";

/**
 * Every prop of a Client Component is serialized into the RSC hydration
 * payload, so passing a whole `CaseStudy` also shipped its unread `seo` field
 * — including the raw Yoast graph, which embeds `cms.tffdigital.com` URLs in
 * the homepage's page source (SEO-2). This component never reads `.seo`, so
 * excluding it from the prop type keeps the CMS hostname out of the payload
 * and makes a future accidental re-introduction a type error.
 */
export type SelectedWorkCaseStudy = Omit<CaseStudy, "seo">;

export interface SelectedWorkProps {
  caseStudies: SelectedWorkCaseStudy[];
}

export function SelectedWork({ caseStudies }: SelectedWorkProps) {
  // Keeps id="work" alive even with zero featured case studies, so the
  // Navbar's /#work anchor always resolves to something — an honest empty
  // state instead of hiding the section (and the anchor with it).
  return (
    <section id="work" className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <motion.div
          {...fadeInUp}
          className="mb-8 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"
        >
          <div>
            <SectionEyebrow>SELECTED WORK</SectionEyebrow>
            <Heading as="h2">
              Growth, <GradientText>made visible.</GradientText>
            </Heading>
          </div>
          <p className="font-body text-muted max-w-xs text-sm">
            A glimpse at the systems we&apos;ve built and the results
            they&apos;ve earned.
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
            {caseStudies.map((caseStudy, index) => (
              <SelectedWorkCard
                key={caseStudy.id}
                caseStudy={caseStudy}
                index={index}
              />
            ))}
          </div>
        )}
      </Container>
    </section>
  );
}

interface SelectedWorkCardProps {
  caseStudy: SelectedWorkCaseStudy;
  index: number;
}

/**
 * Split out from SelectedWork so each card owns its own "did the website
 * preview image fail to load" state — that's inherently per-card, not
 * shareable across the list (React hooks can't live inside .map()).
 */
function SelectedWorkCard({ caseStudy, index }: SelectedWorkCardProps) {
  const [previewFailed, setPreviewFailed] = useState(false);
  const previewUrl = getWebsitePreviewUrl(caseStudy.projectUrl);
  // Covers every fallback case at once: no Project URL, an invalid/unsafe
  // one (see isPreviewableProjectUrl), or a URL that failed to load.
  const showPreview = previewUrl !== null && !previewFailed;

  const headlineResult = caseStudy.results[0];
  const clientLabel = caseStudy.clientName || caseStudy.title;

  const entranceDelay = useEntranceDelay();

  return (
    <motion.div
      {...fadeInUp}
      transition={{
        ...fadeInUp.transition,
        delay: entranceDelay(index * 0.05),
      }}
      className="group border-border-strong relative flex h-72 flex-col justify-end overflow-hidden rounded-[25px] border bg-white/5 p-6"
    >
      <Link
        href={ROUTES.caseStudy(caseStudy.slug)}
        className="focus-visible:ring-primary/50 absolute inset-0 z-10 outline-none focus-visible:ring-2"
        aria-label={`View case study: ${clientLabel}`}
      />
      {showPreview ? (
        <>
          {/* Decorative — the Link above already names the card for
              assistive tech, and this is a background screenshot, not
              content in its own right. */}
          <Image
            src={previewUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            onError={() => setPreviewFailed(true)}
          />
          {/* Screenshots vary wildly in brightness/contrast — a bottom-up
              gradient keeps the name/badge below readable over any site. */}
          <div className="from-background via-background/40 pointer-events-none absolute inset-0 bg-gradient-to-t to-transparent" />
        </>
      ) : (
        <Building2
          className="absolute top-6 right-6 h-10 w-10 text-white/10"
          strokeWidth={1}
        />
      )}
      {headlineResult ? (
        <Badge className="relative mb-3 w-fit" tone="info">
          {headlineResult.value} {headlineResult.label}
        </Badge>
      ) : null}
      <div className="relative flex items-center justify-between">
        <p className="font-heading text-lg font-bold text-white">
          {clientLabel}
        </p>
        <span className="bg-primary flex h-9 w-9 items-center justify-center rounded-full text-white transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0 motion-reduce:group-hover:translate-y-0">
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </motion.div>
  );
}
