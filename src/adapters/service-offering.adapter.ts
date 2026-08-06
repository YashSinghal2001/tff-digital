import type { WPServiceOffering } from "@/types/api/wp-service-offering";
import type { ServiceOffering } from "@/types/domain/service-offering";
import { adaptMedia } from "@/adapters/media.adapter";
import { adaptSeo } from "@/adapters/seo.adapter";

export function adaptServiceOffering(
  wpService: WPServiceOffering,
): ServiceOffering {
  return {
    id: wpService.id,
    slug: wpService.slug,
    title: wpService.title,
    summary: wpService.summary ?? "",
    content: wpService.content,
    icon: wpService.icon ? adaptMedia(wpService.icon) : null,
    featuredImage: wpService.featuredImage
      ? adaptMedia(wpService.featuredImage.node)
      : null,
    order: wpService.menuOrder,
    seo: adaptSeo(wpService.seo, {
      title: wpService.title,
      description: wpService.summary ?? "",
    }),
  };
}
