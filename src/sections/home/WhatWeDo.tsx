"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { ServicesEmptyState } from "@/components/common/ServicesEmptyState";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";
import { fadeInUp } from "@/styles/animations";
import { getServiceCardIcon } from "@/components/icons/service-icons";
import type { ServiceCardItem } from "@/lib/content/service-cards";

interface WhatWeDoProps {
  /**
   * Narrow card data mapped on the server (src/lib/content/service-cards.ts)
   * from the WordPress services, already in display_order and capped to the
   * features this card shows — never the full domain object, so Yoast/CMS
   * data stays out of the client payload (SEO-2).
   */
  services: ServiceCardItem[];
}

export function WhatWeDo({ services }: WhatWeDoProps) {
  return (
    <section id="services" className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <motion.div
          {...fadeInUp}
          className="mx-auto mb-8 max-w-2xl text-center"
        >
          <SectionEyebrow>WHAT WE DO</SectionEyebrow>
          <Heading as="h2">
            A full growth stack,
            <br />
            <GradientText>under one roof.</GradientText>
          </Heading>
          <p className="font-body text-muted mx-auto mt-4 max-w-md text-sm">
            Six disciplines, one integrated system — engineered to move a single
            metric: your growth.
          </p>
        </motion.div>

        <motion.div {...fadeInUp}>
          {services.length === 0 ? (
            <ServicesEmptyState />
          ) : (
            <div
              aria-label="Our services"
              className="flex snap-x snap-mandatory [scrollbar-width:none] gap-4 overflow-x-auto pb-4 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 lg:grid-cols-3 xl:grid-cols-5 [&::-webkit-scrollbar]:hidden"
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
                        <p className="font-body text-muted text-sm">
                          {service.summary}
                        </p>
                        <ul className="flex flex-col gap-2">
                          {service.features.map((feature) => (
                            <li
                              key={feature}
                              className="font-body text-muted flex items-start gap-2 text-sm"
                            >
                              <Check
                                className="text-primary mt-0.5 h-4 w-4 shrink-0"
                                aria-hidden="true"
                              />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <Link
                          href={service.href}
                          className="font-body text-primary relative mt-auto flex items-center gap-1 pt-2 text-sm font-semibold transition-colors hover:text-white"
                        >
                          Learn more
                          <span className="sr-only">
                            {" "}
                            about {service.title}
                          </span>{" "}
                          <ArrowRight
                            className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
                            aria-hidden="true"
                          />
                        </Link>
                      </Card>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-8 flex justify-center">
            <Link
              href={ROUTES.contact}
              className={buttonVariants({ size: "lg" })}
            >
              Let&apos;s Grow Together
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
