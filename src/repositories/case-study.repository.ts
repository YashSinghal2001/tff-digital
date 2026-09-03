import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { parseWordPressResponse } from "@/lib/wordpress/parse-response";
import { buildPreviewAuthHeaders } from "@/lib/wordpress/preview-auth";
import {
  wpCaseStudiesQueryResultSchema,
  wpCaseStudyQueryResultSchema,
} from "@/schemas/api/wp-case-study.schema";
import {
  GET_CASE_STUDIES,
  GET_CASE_STUDY_BY_SLUG,
  GET_CASE_STUDY_PREVIEW,
} from "@/graphql/queries/case-study.queries";
import type {
  WPCaseStudiesQueryResult,
  WPCaseStudyQueryResult,
} from "@/types/api/wp-case-study";

// Responses validated at the boundary (audit CQ-1) — see
// src/lib/wordpress/parse-response.ts and post.repository.ts.

export async function findAllCaseStudies(variables?: {
  first?: number;
  after?: string;
}): Promise<WPCaseStudiesQueryResult> {
  return parseWordPressResponse(
    wpCaseStudiesQueryResultSchema,
    await fetchGraphQL(GET_CASE_STUDIES, variables),
    "GetCaseStudies",
  );
}

export async function findCaseStudyBySlug(
  slug: string,
): Promise<WPCaseStudyQueryResult> {
  return parseWordPressResponse(
    wpCaseStudyQueryResultSchema,
    await fetchGraphQL(GET_CASE_STUDY_BY_SLUG, { slug }),
    "GetCaseStudyBySlug",
  );
}

/**
 * Authenticated draft/preview lookup — never called from a public request
 * path (see src/services/case-study.service.ts). `cache: "no-store"`
 * deliberately bypasses the public queries' 60s ISR window: draft content
 * must never be cached, and must never risk mixing into the shared data
 * cache that public requests read from.
 */
export async function findCaseStudyPreview(
  id: string,
  idType: "SLUG" | "DATABASE_ID",
): Promise<WPCaseStudyQueryResult> {
  return parseWordPressResponse(
    wpCaseStudyQueryResultSchema,
    await fetchGraphQL(
      GET_CASE_STUDY_PREVIEW,
      { id, idType, asPreview: true },
      { headers: buildPreviewAuthHeaders(), cache: "no-store" },
    ),
    "GetCaseStudyPreview",
  );
}
