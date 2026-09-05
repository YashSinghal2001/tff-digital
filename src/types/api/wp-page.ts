import type { WPConnection } from "@/types/api/wp-connection";
import type { WPMediaItem } from "@/types/api/wp-media";
import type { WPSeo } from "@/types/api/wp-seo";

export interface WPPage {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  featuredImage: { node: WPMediaItem } | null;
  seo: WPSeo | null;
}

export interface WPPageQueryResult {
  page: WPPage | null;
}

export interface WPPagesQueryResult {
  pages: WPConnection<WPPage>;
}
