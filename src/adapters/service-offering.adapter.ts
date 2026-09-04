import type { WPServiceOffering } from "@/types/api/wp-service-offering";
import type { ServiceOffering } from "@/types/domain/service-offering";
import { adaptMedia } from "@/adapters/media.adapter";
import { adaptSeo } from "@/adapters/seo.adapter";
import { sanitizeWpHtml } from "@/lib/content/sanitize-wp-html";

export function adaptServiceOffering(
  wpService: WPServiceOffering,
): ServiceOffering {
  const summary = wpService.serviceFields?.shortDescription ?? "";

  return {
    id: wpService.id,
    slug: wpService.slug,
    title: wpService.title,
    summary,
    // Reaches ArticleContent's dangerouslySetInnerHTML — sanitize at the
    // boundary (ARCH-5); the fallback is an ACF free-text field.
    content: sanitizeWpHtml(
      wpService.content || wpService.serviceFields?.description || "",
    ),
    publishedAt: wpService.date,
    updatedAt: wpService.modified,
    icon: wpService.serviceFields?.icon
      ? adaptMedia(wpService.serviceFields.icon.node)
      : null,
    featuredImage: wpService.featuredImage
      ? adaptMedia(wpService.featuredImage.node)
      : null,
    order: wpService.serviceFields?.displayOrder ?? null,
    seo: adaptSeo(wpService.seo, {
      title: wpService.title,
      description: summary,
    }),
  };
}
