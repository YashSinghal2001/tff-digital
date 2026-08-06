import "server-only";
import { wordpressConfig } from "@/config/wordpress.config";
import {
  findAllServiceOfferings,
  findServiceOfferingBySlug,
} from "@/repositories/service-offering.repository";
import { adaptServiceOffering } from "@/adapters/service-offering.adapter";
import {
  getMockServiceOfferingBySlug,
  getMockServiceOfferings,
} from "@/lib/mock/service-offerings.mock";
import type { Paginated } from "@/types/domain/pagination";
import type { ServiceOffering } from "@/types/domain/service-offering";

export async function getServiceOfferings(params?: {
  first?: number;
  after?: string;
}): Promise<Paginated<ServiceOffering>> {
  if (wordpressConfig.useMockData) {
    return getMockServiceOfferings();
  }

  const { services } = await findAllServiceOfferings(params);
  return {
    items: services.nodes.map(adaptServiceOffering),
    pageInfo: services.pageInfo,
    totalCount: services.nodes.length,
  };
}

export async function getServiceOfferingBySlug(
  slug: string,
): Promise<ServiceOffering | null> {
  if (wordpressConfig.useMockData) {
    return getMockServiceOfferingBySlug(slug);
  }

  const { service } = await findServiceOfferingBySlug(slug);
  return service ? adaptServiceOffering(service) : null;
}
