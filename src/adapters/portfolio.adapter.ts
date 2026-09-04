import type { WPPortfolioItem } from "@/types/api/wp-portfolio";
import type { PortfolioItem } from "@/types/domain/portfolio-item";
import { adaptMedia } from "@/adapters/media.adapter";
import { adaptSeo } from "@/adapters/seo.adapter";
import { adaptCategory } from "@/adapters/taxonomy.adapter";
import { sanitizeWpHtml } from "@/lib/content/sanitize-wp-html";

export function adaptPortfolioItem(wpItem: WPPortfolioItem): PortfolioItem {
  return {
    id: wpItem.id,
    slug: wpItem.slug,
    title: wpItem.title,
    summary: wpItem.summary ?? "",
    // Dormant type (no consumers today), but rich text must arrive
    // sanitized wherever it's eventually rendered (ARCH-5).
    content: sanitizeWpHtml(wpItem.content),
    client: wpItem.client,
    featuredImage: wpItem.featuredImage
      ? adaptMedia(wpItem.featuredImage.node)
      : null,
    gallery: wpItem.gallery?.map(adaptMedia) ?? [],
    categories: wpItem.categories?.nodes?.map(adaptCategory) ?? [],
    seo: adaptSeo(wpItem.seo, {
      title: wpItem.title,
      description: wpItem.summary ?? "",
    }),
  };
}
