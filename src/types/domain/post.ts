import type { Author } from "@/types/domain/author";
import type { Media } from "@/types/domain/media";
import type { Seo } from "@/types/domain/seo";
import type { Category, Tag } from "@/types/domain/taxonomy";

export interface Post {
  id: string;
  databaseId: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  updatedAt: string;
  featuredImage: Media | null;
  author: Author | null;
  categories: Category[];
  tags: Tag[];
  seo: Seo | null;
}
