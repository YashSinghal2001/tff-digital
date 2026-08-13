"use client";

import { Heading } from "@/components/ui/Heading";
import { FeatureGrid } from "@/components/common/FeatureGrid";
import { getServiceIcon } from "@/lib/content/service-icons";
import { ROUTES } from "@/constants/routes";
import type { ServiceOffering } from "@/types/domain/service-offering";

export interface RelatedServicesProps {
  services: ServiceOffering[];
}

/**
 * Client component because FeatureGrid's items carry a LucideIcon (a
 * function) — resolving getServiceIcon() here, inside the client boundary,
 * keeps the case study detail page itself a pure Server Component (icon
 * references aren't serializable across the server->client RSC boundary).
 */
export function RelatedServices({ services }: RelatedServicesProps) {
  if (services.length === 0) return null;

  return (
    <div className="mx-auto mt-12 max-w-5xl border-t border-border-subtle pt-10">
      <Heading as="h2" className="mb-6 text-2xl">
        Related services
      </Heading>
      <FeatureGrid
        items={services.map((service) => ({
          icon: getServiceIcon(service.slug),
          title: service.title,
          description: service.summary,
          href: ROUTES.service(service.slug),
        }))}
        gridClassName="sm:grid-cols-2 lg:grid-cols-3"
      />
    </div>
  );
}
