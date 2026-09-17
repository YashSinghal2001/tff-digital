import type { Media } from "@/types/domain/media";
import type { Seo } from "@/types/domain/seo";

export interface ServiceOffering {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  /** Sanitized ACF `custom_html_content`, with any `data-content-section="faq"` block already lifted into `customHtmlFaqs` and removed; empty string when unset. Takes over the content slot on the service detail page when non-empty. */
  customHtmlContent: string;
  /** FAQ items parsed out of customHtmlContent's `data-content-section="faq"` block, if any; empty when the field has no such block or it parsed to zero valid items. */
  customHtmlFaqs: { question: string; answer: string }[];
  publishedAt: string;
  updatedAt: string;
  icon: Media | null;
  featuredImage: Media | null;
  order: number | null;
  /** One entry per non-empty line of the ACF `features` textarea. */
  features: string[];
  /** Rows from the ACF `faqs` repeater with a non-empty question and answer. */
  faqs: { question: string; answer: string }[];
  seo: Seo | null;
}
