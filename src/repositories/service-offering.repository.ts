import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { buildPreviewAuthHeaders } from "@/lib/wordpress/preview-auth";
import {
  GET_SERVICE_BY_SLUG,
  GET_SERVICES,
  GET_SERVICE_PREVIEW,
} from "@/graphql/queries/service-offering.queries";
import type {
  WPServiceOfferingQueryResult,
  WPServiceOfferingsQueryResult,
} from "@/types/api/wp-service-offering";

export function findAllServiceOfferings(variables?: {
  first?: number;
  after?: string;
}) {
  return fetchGraphQL<WPServiceOfferingsQueryResult>(GET_SERVICES, variables);
}

export function findServiceOfferingBySlug(slug: string) {
  return fetchGraphQL<WPServiceOfferingQueryResult>(GET_SERVICE_BY_SLUG, {
    slug,
  });
}

/**
 * Authenticated draft/preview lookup — mirrors
 * case-study.repository.ts's findCaseStudyPreview exactly (same
 * cache/security rationale applies unchanged).
 */
export function findServiceOfferingPreview(
  id: string,
  idType: "SLUG" | "DATABASE_ID",
) {
  return fetchGraphQL<WPServiceOfferingQueryResult>(
    GET_SERVICE_PREVIEW,
    { id, idType, asPreview: true },
    { headers: buildPreviewAuthHeaders(), cache: "no-store" },
  );
}
