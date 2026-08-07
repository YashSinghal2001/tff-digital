import type { WPMediaItem } from "@/types/api/wp-media";
import type { WPSeo } from "@/types/api/wp-seo";
import type { WPConnection } from "@/types/api/wp-connection";

export interface WPServiceFields {
  shortDescription: string | null;
  description: string | null;
  displayOrder: number | null;
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
}

export interface WPServiceOfferingsQueryResult {
  services: WPConnection<WPServiceOffering>;
}

export interface WPServiceOfferingQueryResult {
  service: WPServiceOffering | null;
}
