import type { WPPage } from "@/types/api/wp-page";
import type { ContentPage } from "@/types/domain/content-page";
import { adaptMedia } from "@/adapters/media.adapter";
import { adaptSeo } from "@/adapters/seo.adapter";
import { sanitizeWpHtml } from "@/lib/content/sanitize-wp-html";

export function adaptContentPage(wpPage: WPPage): ContentPage {
  return {
    id: wpPage.id,
    slug: wpPage.slug,
    title: wpPage.title,
    // Dormant type (no consumers today), but rich text must arrive
    // sanitized wherever it's eventually rendered (ARCH-5).
    content: sanitizeWpHtml(wpPage.content),
    featuredImage: wpPage.featuredImage
      ? adaptMedia(wpPage.featuredImage.node)
      : null,
    seo: adaptSeo(wpPage.seo, { title: wpPage.title, description: "" }),
  };
}
