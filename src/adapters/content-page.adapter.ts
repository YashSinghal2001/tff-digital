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
    // WPGraphQL returns null (not "") for content on a Page with no body
    // text — confirmed live (CLIENT-1) — same nullable-free-text pattern
    // as post/case-study/service. Rich text always arrives sanitized
    // before it can reach dangerouslySetInnerHTML (ARCH-5).
    content: sanitizeWpHtml(wpPage.content ?? ""),
    featuredImage: wpPage.featuredImage
      ? adaptMedia(wpPage.featuredImage.node)
      : null,
    seo: adaptSeo(wpPage.seo, { title: wpPage.title, description: "" }),
  };
}
