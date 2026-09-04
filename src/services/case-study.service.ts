import "server-only";
import { cache } from "react";
import { wordpressConfig } from "@/config/wordpress.config";
import {
  findAllCaseStudies,
  findCaseStudyBySlug,
  findCaseStudyPreview,
} from "@/repositories/case-study.repository";
import { adaptCaseStudy } from "@/adapters/case-study.adapter";
import {
  getMockCaseStudies,
  getMockCaseStudyBySlug,
  getMockCaseStudyPreviewByDatabaseId,
} from "@/lib/mock/case-studies.mock";
import type { Paginated } from "@/types/domain/pagination";
import type { CaseStudy } from "@/types/domain/case-study";

const EMPTY_CASE_STUDIES: Paginated<CaseStudy> = {
  items: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  },
  totalCount: 0,
};

/**
 * Throwing variant: a WPGraphQL failure propagates to the caller. Use for a
 * page's PRIMARY content (the /case-studies listing) so an outage surfaces
 * as the route's error boundary (a 5xx — "temporary, come back later")
 * instead of a 200 asserting no case studies exist — the same strict/soft
 * split the blog listing uses (see getPostsStrict).
 */
export async function getCaseStudiesStrict(params?: {
  first?: number;
  after?: string;
}): Promise<Paginated<CaseStudy>> {
  if (wordpressConfig.useMockData) {
    return getMockCaseStudies();
  }

  const { caseStudies } = await findAllCaseStudies(params);
  return {
    items: caseStudies.nodes.map(adaptCaseStudy),
    pageInfo: caseStudies.pageInfo,
    totalCount: caseStudies.nodes.length,
  };
}

export async function getCaseStudies(params?: {
  first?: number;
  after?: string;
}): Promise<Paginated<CaseStudy>> {
  try {
    return await getCaseStudiesStrict(params);
  } catch (error) {
    // Soft variant for secondary surfaces (the homepage Selected Work
    // section, sitemap, generateStaticParams): a live WPGraphQL outage
    // would otherwise take down pages that render fine without case
    // studies, matching getServiceOfferings' resilience pattern.
    console.error(
      "[getCaseStudies] WPGraphQL request failed; rendering without live case studies for this build.",
      error,
    );
    return EMPTY_CASE_STUDIES;
  }
}

// React cache() on the by-slug getters: generateMetadata and the page body
// look up the same slug in the same request, and Next's fetch memoization
// never dedupes these calls (POST + AbortSignal both opt out) — without this
// each render invoked the WPGraphQL fetch twice (PERF-4). Scope is one
// server request; nothing persists across requests or leaks between slugs.
export const getCaseStudyBySlug = cache(
  async (slug: string): Promise<CaseStudy | null> => {
    if (wordpressConfig.useMockData) {
      return getMockCaseStudyBySlug(slug);
    }

    const { caseStudy } = await findCaseStudyBySlug(slug);
    return caseStudy ? adaptCaseStudy(caseStudy) : null;
  },
);

/**
 * Authenticated draft/latest-revision lookup for the preview flow only —
 * never called from a public route. See findCaseStudyPreview for the
 * security/caching rationale.
 */
export const getCaseStudyPreviewBySlug = cache(
  // cache() here dedupes the one place the duplicate costs a REAL second
  // WordPress round-trip: preview fetches are no-store, so the Data Cache
  // never absorbs the metadata+body pair (PERF-4). Per-request only —
  // successive preview loads still fetch the latest draft.
  async (slug: string): Promise<CaseStudy | null> => {
    if (wordpressConfig.useMockData) {
      // Mock mode has no draft/published distinction — reuse the public mock
      // fixture so the preview code path is exercisable in local dev.
      return getMockCaseStudyBySlug(slug);
    }

    const { caseStudy } = await findCaseStudyPreview(slug, "SLUG");
    return caseStudy ? adaptCaseStudy(caseStudy) : null;
  },
);

/**
 * Resolves WordPress's numeric post ID (what the preview_post_link filter
 * hands the redirect route) to the case study, so /api/preview/case-study
 * can find its slug and redirect there — see that route for why ID-based
 * (not slug-based) resolution is used at this step.
 */
export async function getCaseStudyPreviewByDatabaseId(
  id: number,
): Promise<CaseStudy | null> {
  if (wordpressConfig.useMockData) {
    return getMockCaseStudyPreviewByDatabaseId(id);
  }

  const { caseStudy } = await findCaseStudyPreview(String(id), "DATABASE_ID");
  return caseStudy ? adaptCaseStudy(caseStudy) : null;
}
