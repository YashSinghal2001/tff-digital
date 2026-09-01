import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { buildPreviewAuthHeaders } from "@/lib/wordpress/preview-auth";
import {
  GET_CASE_STUDIES,
  GET_CASE_STUDY_BY_SLUG,
  GET_CASE_STUDY_PREVIEW,
} from "@/graphql/queries/case-study.queries";
import type {
  WPCaseStudiesQueryResult,
  WPCaseStudyQueryResult,
} from "@/types/api/wp-case-study";

export function findAllCaseStudies(variables?: {
  first?: number;
  after?: string;
}) {
  return fetchGraphQL<WPCaseStudiesQueryResult>(GET_CASE_STUDIES, variables);
}

export function findCaseStudyBySlug(slug: string) {
  return fetchGraphQL<WPCaseStudyQueryResult>(GET_CASE_STUDY_BY_SLUG, {
    slug,
  });
}

/**
 * Authenticated draft/preview lookup — never called from a public request
 * path (see src/services/case-study.service.ts). `cache: "no-store"`
 * deliberately bypasses the public queries' 60s ISR window: draft content
 * must never be cached, and must never risk mixing into the shared data
 * cache that public requests read from.
 */
export function findCaseStudyPreview(id: string, idType: "SLUG" | "DATABASE_ID") {
  return fetchGraphQL<WPCaseStudyQueryResult>(
    GET_CASE_STUDY_PREVIEW,
    { id, idType, asPreview: true },
    { headers: buildPreviewAuthHeaders(), cache: "no-store" },
  );
}
