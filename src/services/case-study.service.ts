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

export async function getCaseStudies(params?: {
  first?: number;
  after?: string;
}): Promise<Paginated<CaseStudy>> {
  if (wordpressConfig.useMockData) {
    return getMockCaseStudies();
  }

  try {
    const { caseStudies } = await findAllCaseStudies(params);
    return {
      items: caseStudies.nodes.map(adaptCaseStudy),
      pageInfo: caseStudies.pageInfo,
      totalCount: caseStudies.nodes.length,
    };
  } catch (error) {
    // A live WPGraphQL outage would otherwise throw here and take down the
    // entire homepage. Degrade to an empty (still-live-sourced, not mock)
    // result, matching getServiceOfferings' resilience pattern.
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
