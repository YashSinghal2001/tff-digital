"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Card } from "@/components/ui/Card";
import { Heading } from "@/components/ui/Heading";
import { GradientText } from "@/components/ui/GradientText";
import { IconCircle, sizeClass } from "@/components/ui/IconCircle";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { ROUTES } from "@/constants/routes";
import { fadeInUp } from "@/styles/animations";
import { getServiceIcon } from "@/lib/content/service-icons";
import type { ServiceOffering } from "@/types/domain/service-offering";

interface WhatWeDoProps {
  services: ServiceOffering[];
}

const FEATURE_IMAGES: Record<number, { src: string; alt: string }> = {
  0: {
    src: "",
    alt: "Team collaborating on a client growth strategy",
  },
  1: {
    src: "",
    alt: "Performance dashboard showing campaign growth results",
  },
};

const navButtonClass =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(90deg,var(--color-primary)_0%,var(--color-secondary)_100%)] text-white transition-[filter,opacity] duration-150 hover:brightness-110 disabled:pointer-events-none disabled:opacity-40 outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export function WhatWeDo({ services }: WhatWeDoProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateNavState = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    setCanScrollPrev(track.scrollLeft > 1);
    setCanScrollNext(track.scrollLeft < track.scrollWidth - track.clientWidth - 1);
  }, []);

  useEffect(() => {
    updateNavState();
    window.addEventListener("resize", updateNavState);
    return () => window.removeEventListener("resize", updateNavState);
  }, [updateNavState, services.length]);

  const scrollByCard = (direction: -1 | 1) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    if (!card) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    track.scrollBy({ left: direction * (card.offsetWidth + gap) });
  };

  return (
    <section id="services" className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <motion.div
          {...fadeInUp}
          className="mb-12 flex flex-col justify-between gap-4 lg:flex-row lg:items-end"
        >
          <div>
            <SectionEyebrow>WHAT WE DO</SectionEyebrow>
            <Heading as="h2">
              A full growth stack, <GradientText>under one roof.</GradientText>
            </Heading>
          </div>
          <p className="max-w-xs font-body text-sm text-muted">
            Sixteen disciplines, one integrated system — engineered to move a single
            metric: your growth.
          </p>
        </motion.div>

        <motion.div {...fadeInUp}>
          <div
            ref={trackRef}
            onScroll={updateNavState}
            aria-label="Our services"
            className="flex snap-x snap-mandatory gap-6 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] motion-reduce:scroll-auto [&::-webkit-scrollbar]:hidden"
          >
            {services.map((service, index) => {
              const Icon = getServiceIcon(service.slug);
              const image = FEATURE_IMAGES[index];
              return (
                <div
                  key={service.id}
                  className="w-[85%] shrink-0 snap-start sm:w-[calc((100%-1.5rem)/2)] lg:w-[calc((100%-3rem)/3)]"
                >
                  <Card className="flex h-full flex-col gap-4 transition-colors duration-150 hover:bg-white/5">
                    {image?.src ? (
                      <span
                        className={`relative shrink-0 overflow-hidden rounded-full ${sizeClass.md}`}
                      >
                        <Image
                          src={image.src}
                          alt={image.alt}
                          fill
                          sizes="44px"
                          className="object-cover"
                        />
                      </span>
                    ) : (
                      <IconCircle icon={Icon} size="md" />
                    )}
                    <h3 className="font-heading text-lg font-bold text-white">
                      {service.title}
                    </h3>
                    <p className="font-body text-sm text-muted">{service.summary}</p>
                    <Link
                      href={ROUTES.service(service.slug)}
                      className="relative mt-auto flex items-center gap-1 font-body text-sm font-semibold text-primary"
                    >
                      Learn more
                      <span className="sr-only"> about {service.title}</span>{" "}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Card>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => scrollByCard(-1)}
              disabled={!canScrollPrev}
              aria-label="Previous services"
              className={navButtonClass}
            >
              <ArrowLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => scrollByCard(1)}
              disabled={!canScrollNext}
              aria-label="Next services"
              className={navButtonClass}
            >
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </motion.div>
      </Container>
    </section>
  );
}
