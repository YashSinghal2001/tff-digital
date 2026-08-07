import type { Media } from "@/types/domain/media";
import type { Seo } from "@/types/domain/seo";

export interface ServiceOffering {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  publishedAt: string;
  updatedAt: string;
  icon: Media | null;
  featuredImage: Media | null;
  order: number | null;
  seo: Seo | null;
}
