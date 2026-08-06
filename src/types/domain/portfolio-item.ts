import type { Media } from "@/types/domain/media";
import type { Seo } from "@/types/domain/seo";
import type { Category } from "@/types/domain/taxonomy";

export interface PortfolioItem {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  client: string | null;
  featuredImage: Media | null;
  gallery: Media[];
  categories: Category[];
  seo: Seo | null;
}
