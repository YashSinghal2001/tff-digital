import type {
  WPServiceFields,
  WPServiceOffering,
} from "@/types/api/wp-service-offering";
import type { ServiceOffering } from "@/types/domain/service-offering";
import { adaptMedia } from "@/adapters/media.adapter";
import { adaptSeo } from "@/adapters/seo.adapter";
import { sanitizeWpHtml } from "@/lib/content/sanitize-wp-html";
import { extractFaqSection } from "@/lib/content/extract-faq-section";

// The ACF `features` textarea arrives as one string with CRLF (wp-admin) or
// LF line endings; each non-empty trimmed line is one feature bullet.
export function parseServiceFeatures(raw: string | null | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

// ACF repeater rows arrive with possibly-null question/answer (an
// in-progress or malformed row) — trim both and drop the row unless both
// are non-empty, same tolerance-of-CMS-mess policy as parseServiceFeatures.
export function parseServiceFaqs(
  raw: WPServiceFields["faqs"],
): { question: string; answer: string }[] {
  if (!raw) return [];
  return raw
    .map((row) => ({
      question: (row.question ?? "").trim(),
      answer: (row.answer ?? "").trim(),
    }))
    .filter((row) => row.question.length > 0 && row.answer.length > 0);
}

export function adaptServiceOffering(
  wpService: WPServiceOffering,
): ServiceOffering {
  const summary = wpService.serviceFields?.shortDescription ?? "";

  // CONTENT-FAQ: pull the CMS-authored FAQ section (data-content-section=
  // "faq") out of customHtmlContent AFTER sanitizing it, so extraction only
  // ever sees the same well-formed, script-free tree ArticleContent will
  // render — never the raw wp-admin field. The marked section is removed
  // from customHtmlContent either way (found-but-empty still counts as
  // "handled"), so it can never render twice: once as raw HTML and once
  // through the FAQ component.
  const { html: customHtmlContent, faqs: customHtmlFaqs } = extractFaqSection(
    sanitizeWpHtml(wpService.serviceFields?.customHtmlContent || ""),
  );

  return {
    id: wpService.id,
    slug: wpService.slug,
    title: wpService.title,
    summary,
    // Reaches ArticleContent's dangerouslySetInnerHTML — sanitize at the
    // boundary (ARCH-5); the fallback is an ACF free-text field.
    content: sanitizeWpHtml(
      wpService.content || wpService.serviceFields?.description || "",
    ),
    customHtmlContent,
    customHtmlFaqs,
    publishedAt: wpService.date,
    updatedAt: wpService.modified,
    icon: wpService.serviceFields?.icon
      ? adaptMedia(wpService.serviceFields.icon.node)
      : null,
    featuredImage: wpService.featuredImage
      ? adaptMedia(wpService.featuredImage.node)
      : null,
    order: wpService.serviceFields?.displayOrder ?? null,
    features: parseServiceFeatures(wpService.serviceFields?.features),
    faqs: parseServiceFaqs(wpService.serviceFields?.faqs),
    seo: adaptSeo(wpService.seo, {
      title: wpService.title,
      description: summary,
    }),
  };
}
