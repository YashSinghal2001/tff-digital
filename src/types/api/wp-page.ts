import type { WPMediaItem } from "@/types/api/wp-media";
import type { WPSeo } from "@/types/api/wp-seo";

export interface WPPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  featuredImage: { node: WPMediaItem } | null;
  seo: WPSeo | null;
}

export interface WPPageQueryResult {
  page: WPPage | null;
}
