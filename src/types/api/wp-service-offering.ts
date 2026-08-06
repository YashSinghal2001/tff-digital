import type { WPMediaItem } from "@/types/api/wp-media";
import type { WPSeo } from "@/types/api/wp-seo";
import type { WPConnection } from "@/types/api/wp-connection";

export interface WPServiceOffering {
  id: string;
  slug: string;
  title: string;
  content: string;
  summary: string | null;
  icon: WPMediaItem | null;
  featuredImage: { node: WPMediaItem } | null;
  menuOrder: number | null;
  seo: WPSeo | null;
}

export interface WPServiceOfferingsQueryResult {
  services: WPConnection<WPServiceOffering>;
}

export interface WPServiceOfferingQueryResult {
  service: WPServiceOffering | null;
}
