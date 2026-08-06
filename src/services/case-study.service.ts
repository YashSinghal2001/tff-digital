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

export async function getCaseStudies(params?: {
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

export async function getCaseStudyBySlug(
  slug: string,
): Promise<CaseStudy | null> {
  if (wordpressConfig.useMockData) {
    return getMockCaseStudyBySlug(slug);
  }

  const { caseStudy } = await findCaseStudyBySlug(slug);
  return caseStudy ? adaptCaseStudy(caseStudy) : null;
}
