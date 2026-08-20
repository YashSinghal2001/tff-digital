"use client";

import { Container } from "@/components/ui/Container";
import { FeatureGrid, type FeatureGridItem } from "@/components/common/FeatureGrid";
import { ROUTES } from "@/constants/routes";
import { getServiceIcon } from "@/lib/content/service-icons";
import type { ServiceOffering } from "@/types/domain/service-offering";

type ServicesGridService = Pick<
  ServiceOffering,
  "id" | "slug" | "title" | "summary"
> & {
  /**
   * Optional explicit link target. Undefined keeps the default
   * /services/[slug] link (the WordPress-driven behavior); null renders the
   * card unlinked — used by the temporary data for disciplines whose detail
   * page doesn't exist yet.
   */
  href?: string | null;
};

interface ServicesGridProps {
  services: ServicesGridService[];
}

export function ServicesGrid({ services }: ServicesGridProps) {
  const items: FeatureGridItem[] = services.map((service) => ({
    icon: getServiceIcon(service.slug),
    title: service.title,
    description: service.summary,
    href:
      service.href === undefined
        ? ROUTES.service(service.slug)
        : (service.href ?? undefined),
  }));

  return (
    <section id="grid" className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        {/* Visually hidden: keeps the h1 -> h3 card titles in valid heading order without adding a visible section title the design doesn't call for. */}
        <h2 className="sr-only">Our services</h2>
        <FeatureGrid items={items} titleClassName="text-lg" />
      </Container>
    </section>
  );
}
