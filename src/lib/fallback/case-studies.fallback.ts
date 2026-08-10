// ============================================================================
// TEMPORARY DEMO FALLBACK — safe to delete.
//
// WordPress has no real case studies yet, so these two hard-coded entries keep
// the Work section populated for the demo. As soon as real case studies exist
// in WordPress, they automatically take precedence and this fallback never
// renders. To remove: delete this file and its call sites in
// src/app/page.tsx, src/app/case-studies/page.tsx, and
// src/app/case-studies/[slug]/page.tsx.
// ============================================================================
import type { CaseStudy } from "@/types/domain/case-study";

// The live CMS currently contains a throwaway "Test" entry ("1932 Leads
// Generated"). It is excluded here so it never renders and never blocks the
// fallback. Real case studies added later are unaffected.
const PLACEHOLDER_SLUGS = new Set(["test"]);

export const fallbackCaseStudies: CaseStudy[] = [
  {
    id: "fallback-case-study-1",
    slug: "performance-marketing-growth-system",
    title: "Performance Marketing Growth System",
    excerpt:
      "A performance-led growth system combining paid acquisition, landing page optimization, and conversion-focused creative to turn more qualified traffic into measurable business growth.",
    content: "",
    publishedAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    clientName: "",
    industry: "Performance Marketing",
    projectUrl: null,
    summary:
      "A performance-led growth system combining paid acquisition, landing page optimization, and conversion-focused creative to turn more qualified traffic into measurable business growth.",
    challenge: "",
    solution: "",
    results: [{ label: "Conversion Rate", value: "+64%" }],
    featuredOnHomepage: true,
    featuredImage: null,
    relatedServices: [],
    seo: null,
  },
  {
    id: "fallback-case-study-2",
    slug: "seo-growth-organic-visibility",
    title: "SEO Growth & Organic Visibility",
    excerpt:
      "A focused SEO strategy built around technical optimization, content structure, search intent, and authority building to create sustainable organic visibility and qualified inbound traffic.",
    content: "",
    publishedAt: "2026-08-10T00:00:00.000Z",
    updatedAt: "2026-08-10T00:00:00.000Z",
    clientName: "",
    industry: "Search Engine Optimization",
    projectUrl: null,
    summary:
      "A focused SEO strategy built around technical optimization, content structure, search intent, and authority building to create sustainable organic visibility and qualified inbound traffic.",
    challenge: "",
    solution: "",
    results: [{ label: "Organic Traffic", value: "+185%" }],
    featuredOnHomepage: true,
    featuredImage: null,
    relatedServices: [],
    seo: null,
  },
];

/**
 * WordPress case studies exist → return them (fallback never shows).
 * WordPress empty (or only the "Test" placeholder) → return the two
 * temporary fallback case studies.
 */
export function withCaseStudyFallback(items: CaseStudy[]): CaseStudy[] {
  const realItems = items.filter(
    (caseStudy) => !PLACEHOLDER_SLUGS.has(caseStudy.slug),
  );
  return realItems.length > 0 ? realItems : fallbackCaseStudies;
}

export function getFallbackCaseStudyBySlug(slug: string): CaseStudy | null {
  return (
    fallbackCaseStudies.find((caseStudy) => caseStudy.slug === slug) ?? null
  );
}
