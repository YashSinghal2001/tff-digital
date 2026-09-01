import "server-only";
import { wordpressConfig } from "@/config/wordpress.config";
import {
  findAllCaseStudies,
  findCaseStudyBySlug,
} from "@/repositories/case-study.repository";
import { adaptCaseStudy } from "@/adapters/case-study.adapter";
import {
  getMockCaseStudies,
  getMockCaseStudyBySlug,
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

export async function getCaseStudyBySlug(
  slug: string,
): Promise<CaseStudy | null> {
  if (wordpressConfig.useMockData) {
    return getMockCaseStudyBySlug(slug);
  }

  const { caseStudy } = await findCaseStudyBySlug(slug);
  return caseStudy ? adaptCaseStudy(caseStudy) : null;
}
