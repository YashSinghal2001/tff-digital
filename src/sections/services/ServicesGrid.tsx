"use client";

import { Container } from "@/components/ui/Container";
import {
  FeatureGrid,
  type FeatureGridItem,
} from "@/components/common/FeatureGrid";
import { ServicesEmptyState } from "@/components/common/ServicesEmptyState";
import { getServiceIcon } from "@/lib/content/service-icons";
import type { ServiceCardItem } from "@/lib/content/service-cards";

interface ServicesGridProps {
  /**
   * Narrow card data mapped on the server (src/lib/content/service-cards.ts)
   * from the WordPress services, already in display_order — never the full
   * domain object, so Yoast/CMS data stays out of the client payload (SEO-2).
   */
  services: ServiceCardItem[];
}

export function ServicesGrid({ services }: ServicesGridProps) {
  const items: FeatureGridItem[] = services.map((service) => ({
    icon: getServiceIcon(service.slug),
    title: service.title,
    description: service.summary,
    features: service.features,
    href: service.href,
  }));

  return (
    <section id="grid" className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        {/* Visually hidden: keeps the h1 -> h3 card titles in valid heading order without adding a visible section title the design doesn't call for. */}
        <h2 className="sr-only">Our services</h2>
        {items.length > 0 ? (
          <FeatureGrid items={items} titleClassName="text-lg" />
        ) : (
          <ServicesEmptyState />
        )}
      </Container>
    </section>
  );
}
