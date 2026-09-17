import type { WPMediaItem } from "@/types/api/wp-media";
import type { WPSeo } from "@/types/api/wp-seo";
import type { WPConnection } from "@/types/api/wp-connection";

export interface WPServiceFields {
  shortDescription: string | null;
  description: string | null;
  displayOrder: number | null;
  // ACF textarea: one feature per line (CRLF-separated from wp-admin).
  features: string | null;
  icon: { node: WPMediaItem } | null;
  // ACF textarea: raw HTML, rendered as-is (sanitized in the adapter) in
  // place of `description`/`content` when present.
  customHtmlContent: string | null;
  // ACF repeater (question/answer sub-fields). Optional, not just nullable:
  // the live WPGraphQL schema doesn't expose this field yet (verified —
  // querying it errors the whole request), so SERVICE_FIELDS doesn't select
  // it and it's simply absent from today's response. See wp-case-study.ts's
  // result1Label precedent: if ACF Repeater turns out to be unavailable
  // here too, this becomes fixed faq1Question/faq1Answer-style fields
  // instead.
  faqs?: { question: string | null; answer: string | null }[] | null;
}

export interface WPServiceOffering {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  date: string;
  modified: string;
  featuredImage: { node: WPMediaItem } | null;
  serviceFields: WPServiceFields | null;
  seo: WPSeo | null;
  // Only requested by the preview query (GET_SERVICE_PREVIEW) — undefined
  // on every public query's response.
  databaseId?: number;
  status?: string;
}

export interface WPServiceOfferingsQueryResult {
  services: WPConnection<WPServiceOffering>;
}

export interface WPServiceOfferingQueryResult {
  service: WPServiceOffering | null;
}
