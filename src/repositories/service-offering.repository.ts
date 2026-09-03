import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { parseWordPressResponse } from "@/lib/wordpress/parse-response";
import { buildPreviewAuthHeaders } from "@/lib/wordpress/preview-auth";
import {
  wpServiceOfferingQueryResultSchema,
  wpServiceOfferingsQueryResultSchema,
} from "@/schemas/api/wp-service-offering.schema";
import {
  GET_SERVICE_BY_SLUG,
  GET_SERVICES,
  GET_SERVICE_PREVIEW,
} from "@/graphql/queries/service-offering.queries";
import type {
  WPServiceOfferingQueryResult,
  WPServiceOfferingsQueryResult,
} from "@/types/api/wp-service-offering";

// Responses validated at the boundary (audit CQ-1) — see
// src/lib/wordpress/parse-response.ts and post.repository.ts.

export async function findAllServiceOfferings(variables?: {
  first?: number;
  after?: string;
}): Promise<WPServiceOfferingsQueryResult> {
  return parseWordPressResponse(
    wpServiceOfferingsQueryResultSchema,
    await fetchGraphQL(GET_SERVICES, variables),
    "GetServices",
  );
}

export async function findServiceOfferingBySlug(
  slug: string,
): Promise<WPServiceOfferingQueryResult> {
  return parseWordPressResponse(
    wpServiceOfferingQueryResultSchema,
    await fetchGraphQL(GET_SERVICE_BY_SLUG, { slug }),
    "GetServiceBySlug",
  );
}

/**
 * Authenticated draft/preview lookup — mirrors
 * case-study.repository.ts's findCaseStudyPreview exactly (same
 * cache/security rationale applies unchanged).
 */
export async function findServiceOfferingPreview(
  id: string,
  idType: "SLUG" | "DATABASE_ID",
): Promise<WPServiceOfferingQueryResult> {
  return parseWordPressResponse(
    wpServiceOfferingQueryResultSchema,
    await fetchGraphQL(
      GET_SERVICE_PREVIEW,
      { id, idType, asPreview: true },
      { headers: buildPreviewAuthHeaders(), cache: "no-store" },
    ),
    "GetServicePreview",
  );
}
