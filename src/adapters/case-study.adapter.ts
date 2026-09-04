import type { WPCaseStudy, WPCaseStudyFields } from "@/types/api/wp-case-study";
import type { CaseStudy, CaseStudyResult } from "@/types/domain/case-study";
import { adaptMedia } from "@/adapters/media.adapter";
import { sanitizeWpHtml } from "@/lib/content/sanitize-wp-html";
import { adaptSeo } from "@/adapters/seo.adapter";
import { adaptServiceOffering } from "@/adapters/service-offering.adapter";

// ACF Repeater is unavailable on this WordPress installation, so "Results"
// is four fixed label/value field pairs. Normalized here into an array so
// consumers see the same shape a real repeater would have produced; pairs
// missing either a label or a value are dropped as incomplete.
function adaptCaseStudyResults(
  fields: WPCaseStudyFields | null,
): CaseStudyResult[] {
  const pairs: [string | null, string | null][] = [
    [fields?.result1Label ?? null, fields?.result1Value ?? null],
    [fields?.result2Label ?? null, fields?.result2Value ?? null],
    [fields?.result3Label ?? null, fields?.result3Value ?? null],
    [fields?.result4Label ?? null, fields?.result4Value ?? null],
  ];

  return pairs
    .filter((pair): pair is [string, string] => Boolean(pair[0] && pair[1]))
    .map(([label, value]) => ({ label, value }));
}

export function adaptCaseStudy(wpCaseStudy: WPCaseStudy): CaseStudy {
  const fields = wpCaseStudy.caseStudyFields;
  const summary = fields?.shortSummary ?? "";

  return {
    id: wpCaseStudy.id,
    slug: wpCaseStudy.slug,
    title: wpCaseStudy.title,
    excerpt: wpCaseStudy.excerpt ?? "",
    // Rich-text fields reach ArticleContent's dangerouslySetInnerHTML —
    // sanitize at the boundary (ARCH-5); challenge/solution are ACF free
    // text, the same enforce-nothing field class as projectUrl (SEC3-1).
    content: sanitizeWpHtml(wpCaseStudy.content ?? ""),
    publishedAt: wpCaseStudy.date,
    updatedAt: wpCaseStudy.modified,
    clientName: fields?.clientName ?? "",
    industry: fields?.industry ?? "",
    projectUrl: fields?.projectUrl ?? null,
    summary,
    challenge: sanitizeWpHtml(fields?.challenge ?? ""),
    solution: sanitizeWpHtml(fields?.solution ?? ""),
    results: adaptCaseStudyResults(fields),
    featuredOnHomepage: fields?.featuredOnHomepage ?? false,
    featuredImage: wpCaseStudy.featuredImage
      ? adaptMedia(wpCaseStudy.featuredImage.node)
      : null,
    relatedServices:
      fields?.relatedServices?.nodes?.map(adaptServiceOffering) ?? [],
    seo: adaptSeo(wpCaseStudy.seo, {
      title: wpCaseStudy.title,
      description: summary,
    }),
  };
}
