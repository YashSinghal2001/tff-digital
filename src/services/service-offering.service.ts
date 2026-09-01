import "server-only";
import { wordpressConfig } from "@/config/wordpress.config";
import {
  findAllServiceOfferings,
  findServiceOfferingBySlug,
  findServiceOfferingPreview,
} from "@/repositories/service-offering.repository";
import { adaptServiceOffering } from "@/adapters/service-offering.adapter";
import {
  getMockServiceOfferingBySlug,
  getMockServiceOfferings,
  getMockServiceOfferingPreviewByDatabaseId,
} from "@/lib/mock/service-offerings.mock";
import type { Paginated } from "@/types/domain/pagination";
import type { ServiceOffering } from "@/types/domain/service-offering";

const EMPTY_SERVICE_OFFERINGS: Paginated<ServiceOffering> = {
  items: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  },
  totalCount: 0,
};

export async function getServiceOfferings(params?: {
  first?: number;
  after?: string;
}): Promise<Paginated<ServiceOffering>> {
  if (wordpressConfig.useMockData) {
    return getMockServiceOfferings();
  }

  try {
    const { services } = await findAllServiceOfferings(params);
    return {
      items: services.nodes.map(adaptServiceOffering),
      pageInfo: services.pageInfo,
      totalCount: services.nodes.length,
    };
  } catch (error) {
    // A live WPGraphQL outage during a Vercel build would otherwise throw here
    // and fail the entire deployment. Degrade to an empty (still-live-sourced,
    // not mock) result so the build succeeds; the next successful build will
    // pick up real data again.
    console.error(
      "[getServiceOfferings] WPGraphQL request failed; rendering without live services for this build.",
      error,
    );
    return EMPTY_SERVICE_OFFERINGS;
  }
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

/**
 * Authenticated draft/latest-revision lookup for the preview flow only —
 * mirrors case-study.service.ts's getCaseStudyPreviewBySlug.
 */
export async function getServiceOfferingPreviewBySlug(
  slug: string,
): Promise<ServiceOffering | null> {
  if (wordpressConfig.useMockData) {
    return getMockServiceOfferingBySlug(slug);
  }

  const { service } = await findServiceOfferingPreview(slug, "SLUG");
  return service ? adaptServiceOffering(service) : null;
}

/**
 * Resolves WordPress's numeric post ID (handed to /api/preview/service by
 * the preview_post_link filter) to the service, so that route can find its
 * slug and redirect there — mirrors getCaseStudyPreviewByDatabaseId.
 */
export async function getServiceOfferingPreviewByDatabaseId(
  id: number,
): Promise<ServiceOffering | null> {
  if (wordpressConfig.useMockData) {
    return getMockServiceOfferingPreviewByDatabaseId(id);
  }

  const { service } = await findServiceOfferingPreview(String(id), "DATABASE_ID");
  return service ? adaptServiceOffering(service) : null;
}
