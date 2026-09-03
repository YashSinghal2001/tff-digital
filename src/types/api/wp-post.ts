import type { WPAuthor } from "@/types/api/wp-author";
import type { WPConnection } from "@/types/api/wp-connection";
import type { WPMediaItem } from "@/types/api/wp-media";
import type { WPSeo } from "@/types/api/wp-seo";
import type { WPCategory, WPTag } from "@/types/api/wp-taxonomy";

export interface WPPost {
  id: string;
  databaseId: number;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  date: string;
  modified: string;
  featuredImage: { node: WPMediaItem } | null;
  author: WPAuthor | null;
  // Nodes-only, not WPConnection: the PostFields fragment selects only
  // `nodes` on these nested connections (no pageInfo), so a full
  // WPConnection here would claim a key the response never contains —
  // caught while pinning the CQ-1 schemas to these types. Mirrors the
  // relatedServices shape in wp-case-study.ts.
  categories: { nodes: WPCategory[] } | null;
  tags: { nodes: WPTag[] } | null;
  seo: WPSeo | null;
}

export interface WPPostsQueryResult {
  posts: WPConnection<WPPost>;
}

export interface WPPostQueryResult {
  post: WPPost | null;
}
