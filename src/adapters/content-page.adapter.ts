import type { WPPage } from "@/types/api/wp-page";
import type { ContentPage } from "@/types/domain/content-page";
import { adaptMedia } from "@/adapters/media.adapter";
import { adaptSeo } from "@/adapters/seo.adapter";

export function adaptContentPage(wpPage: WPPage): ContentPage {
  return {
    id: wpPage.id,
    slug: wpPage.slug,
    title: wpPage.title,
    content: wpPage.content,
    featuredImage: wpPage.featuredImage
      ? adaptMedia(wpPage.featuredImage.node)
      : null,
    seo: adaptSeo(wpPage.seo, { title: wpPage.title, description: "" }),
  };
}
