import type { WPConnection } from "@/types/api/wp-connection";

export interface WPCategory {
  id: string;
  name: string;
  slug: string;
  count: number | null;
}

export interface WPTag {
  id: string;
  name: string;
  slug: string;
}

export interface WPCategoriesQueryResult {
  categories: WPConnection<WPCategory>;
}

export interface WPTagsQueryResult {
  tags: WPConnection<WPTag>;
}
