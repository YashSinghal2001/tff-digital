import type { Media } from "@/types/domain/media";
import type { Seo } from "@/types/domain/seo";

/**
 * A generic WordPress "page" (Homepage, About, Contact, ...).
 * Named ContentPage to avoid colliding with the Next.js "page" concept.
 */
export interface ContentPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  featuredImage: Media | null;
  seo: Seo | null;
}
