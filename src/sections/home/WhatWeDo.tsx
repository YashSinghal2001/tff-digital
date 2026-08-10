"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";
import { fadeInUp } from "@/styles/animations";
import { getServiceCardIcon } from "@/components/icons/service-icons";
import type { ServiceOffering } from "@/types/domain/service-offering";

// TEMPORARY: WordPress What We Do content disabled for UI development.
// Mock cards reuse the real ServiceOffering fields the UI needs, plus the
// `features` list the new design calls for (not yet modeled in WordPress).
type TemporaryWhatWeDoService = Pick<
  ServiceOffering,
  "id" | "slug" | "title" | "summary"
> & { features: string[] };

const temporaryWhatWeDoServices: TemporaryWhatWeDoService[] = [
  {
    id: "temp-aeo-seo",
    slug: "seo",
    title: "AEO & SEO Services",
    summary: "Get found. Build authority. Drive organic growth.",
    features: ["Answer Engine Optimization", "Technical SEO", "Organic Growth"],
  },
  {
    id: "temp-smm",
    slug: "smm",
    title: "SMM Services",
    summary: "Build brand love. Grow your community.",
    features: ["Content Strategy", "Engagement Growth", "Social Visibility"],
  },
  {
    id: "temp-meta-ads",
    slug: "google-meta-ads",
    title: "Meta Ads",
    summary: "Reach the right people. Turn clicks into customers.",
    features: ["Targeted Campaigns", "Lower CPA", "Higher ROI"],
  },
  {
    id: "temp-web-dev",
    slug: "web-development",
    title: "Web Development",
    summary: "Fast. Modern. Conversion focused websites.",
    features: ["SEO-Friendly Structure", "Mobile Responsive", "Better User Experience"],
  },
  {
    id: "temp-video-editing",
    slug: "video-editing",
    title: "Video Editing",
    summary: "Create scroll-stopping content that converts.",
    features: ["Engaging Visuals", "Social Ready Videos", "Brand Storytelling"],
  },
];

// TEMPORARY: WordPress What We Do content disabled for UI development.
// Original WordPress-driven signature — restore this and delete the mock above:
// interface WhatWeDoProps {
//   services: ServiceOffering[];
// }
// export function WhatWeDo({ services }: WhatWeDoProps) {
//
// TODO: RESTORE WORDPRESS DATA
// Remove temporaryWhatWeDoServices usage and restore the existing WordPress
// service data source (the `services` prop passed from src/app/page.tsx).
// WordPress integration has intentionally NOT been deleted.
export function WhatWeDo() {
  const services = temporaryWhatWeDoServices;

  return (
    <section id="services" className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div {...fadeInUp} className="mx-auto mb-12 max-w-2xl text-center">
          <SectionEyebrow>WHAT WE DO</SectionEyebrow>
          <Heading as="h2">
            A full growth stack,
            <br />
            <GradientText>under one roof.</GradientText>
          </Heading>
          <p className="mx-auto mt-4 max-w-md font-body text-sm text-muted">
            Sixteen disciplines, one integrated system — engineered to move a single
            metric: your growth.
          </p>
        </motion.div>

        <motion.div {...fadeInUp}>
          <div
            aria-label="Our services"
            className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3 xl:grid-cols-5"
          >
            {services.map((service) => {
              const Icon = getServiceCardIcon(service.slug);
              return (
                <div
                  key={service.id}
                  className="w-[85%] shrink-0 snap-start sm:w-auto"
                >
                  <div className="group h-full rounded-[25px] bg-[linear-gradient(135deg,color-mix(in_srgb,var(--color-primary)_40%,transparent),color-mix(in_srgb,var(--color-secondary)_40%,transparent))] p-px transition-transform duration-200 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
                    <Card className="flex h-full flex-col gap-4 border-0 bg-[color-mix(in_srgb,var(--color-background)_94%,#ffffff)] p-5 transition-shadow duration-200 group-hover:shadow-[0_0_32px_0_rgba(56,130,246,0.18)]">
                      <Icon className="h-20 w-20 shrink-0" />
                      <h3 className="font-heading text-lg font-bold text-white xl:text-base">
                        {service.title}
                      </h3>
                      <p className="font-body text-sm text-muted">{service.summary}</p>
                      <ul className="flex flex-col gap-2">
                        {service.features.map((feature) => (
                          <li
                            key={feature}
                            className="flex items-start gap-2 font-body text-sm text-muted"
                          >
                            <Check
                              className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                              aria-hidden="true"
                            />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Link
                        href={ROUTES.service(service.slug)}
                        className="relative mt-auto flex items-center gap-1 pt-2 font-body text-sm font-semibold text-primary transition-colors hover:text-white"
                      >
                        Learn more
                        <span className="sr-only"> about {service.title}</span>{" "}
                        <ArrowRight
                          className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none"
                          aria-hidden="true"
                        />
                      </Link>
                    </Card>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-12 flex justify-center">
            <Link href={ROUTES.contact} className={buttonVariants({ size: "lg" })}>
              Let&apos;s Grow Together
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
