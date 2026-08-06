import type { WPConnection } from "@/types/api/wp-connection";
import type { WPMediaItem } from "@/types/api/wp-media";
import type { WPSeo } from "@/types/api/wp-seo";
import type { WPCategory } from "@/types/api/wp-taxonomy";

export interface WPPortfolioItem {
  id: string;
  slug: string;
  title: string;
  content: string;
  summary: string | null;
  client: string | null;
  featuredImage: { node: WPMediaItem } | null;
  gallery: WPMediaItem[] | null;
  categories: WPConnection<WPCategory> | null;
  seo: WPSeo | null;
}

export interface WPPortfolioItemsQueryResult {
  portfolioItems: WPConnection<WPPortfolioItem>;
}

export interface WPPortfolioItemQueryResult {
  portfolioItem: WPPortfolioItem | null;
}
