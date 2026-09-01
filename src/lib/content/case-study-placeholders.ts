import type { CaseStudy } from "@/types/domain/case-study";

// The live CMS contains a throwaway "Test" entry that the site owner keeps
// for admin experimentation (deleting WordPress content is outside this
// repo's reach). Case studies are otherwise fully WordPress-driven — these
// slugs are the one editorial exception: they must never render, never be
// linked, never appear in the sitemap, and their URLs must 404. Real case
// studies added in WordPress are unaffected.
const PLACEHOLDER_SLUGS = new Set(["test"]);

/** True for throwaway CMS entries that must never render — the detail route
 *  404s them so they can't be reached directly while hidden from the
 *  listing, homepage, and sitemap. */
export function isPlaceholderCaseStudySlug(slug: string): boolean {
  return PLACEHOLDER_SLUGS.has(slug);
}

/** The published WordPress case studies minus placeholder entries — the
 *  single source every consumer (homepage, listing, sitemap, prerender
 *  params) filters through, so "Test" can never leak anywhere. */
export function filterPlaceholderCaseStudies(items: CaseStudy[]): CaseStudy[] {
  return items.filter(
    (caseStudy) => !isPlaceholderCaseStudySlug(caseStudy.slug),
  );
}
