import type { CaseStudy } from "@/types/domain/case-study";
import type { Paginated } from "@/types/domain/pagination";
import { buildMockSeo, mockMedia } from "@/lib/mock/shared.mock";
import { mockServiceOfferings } from "@/lib/mock/service-offerings.mock";

export const mockCaseStudies: CaseStudy[] = [
  {
    id: "mock-case-study-1",
    slug: "acme-growth-story",
    title: "Acme Growth Story",
    summary: "Placeholder summary for the Acme growth case study.",
    content: "<p>Placeholder content.</p>",
    client: "Acme Co.",
    industry: "Retail",
    featuredImage: mockMedia,
    metrics: [
      { label: "Revenue Growth", value: "32%" },
      { label: "Conversion Rate", value: "+18%" },
    ],
    relatedServices: [mockServiceOfferings[0]],
    seo: buildMockSeo(
      "Acme Growth Story",
      "Placeholder summary for the Acme growth case study.",
    ),
  },
];

export function getMockCaseStudies(): Paginated<CaseStudy> {
  return {
    items: mockCaseStudies,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
    totalCount: mockCaseStudies.length,
  };
}

export function getMockCaseStudyBySlug(slug: string): CaseStudy | null {
  return mockCaseStudies.find((caseStudy) => caseStudy.slug === slug) ?? null;
}
