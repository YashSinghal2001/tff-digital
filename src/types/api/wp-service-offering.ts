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
