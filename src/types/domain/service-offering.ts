import type { Media } from "@/types/domain/media";
import type { Seo } from "@/types/domain/seo";

export interface ServiceOffering {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  /** Sanitized ACF `custom_html_content`; empty string when unset. Takes over the content slot on the service detail page when non-empty. */
  customHtmlContent: string;
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
