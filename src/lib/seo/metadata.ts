import type { Metadata } from "next";
import type { Seo } from "@/types/domain/seo";
import { seoConfig } from "@/config/seo.config";

export interface ContentMetadataFallback {
  /** The content item's own title (post/case study/service), used when the
   *  CMS item has no SEO data — otherwise the page renders the site default
   *  and the layout template turns it into "TFF Digital | TFF Digital". */
  title?: string;
  description?: string;
}

export function buildMetadata(
  seo: Seo | null,
  canonicalUrl?: string,
  fallback?: ContentMetadataFallback,
  overrides?: Partial<Metadata>,
): Metadata {
  const title = seo?.title || fallback?.title || seoConfig.defaultTitle;
  const description =
    seo?.description || fallback?.description || seoConfig.defaultDescription;
  const resolvedCanonical = canonicalUrl ?? seo?.canonicalUrl ?? undefined;

  const metadata: Metadata = {
    // WordPress SEO titles (Yoast) already include the site name, so this
    // must bypass the root layout's `%s | ${siteName}` template — otherwise
    // every WP-sourced title gets the site name appended twice. Fallback
    // titles (the content item's own title) deliberately go THROUGH the
    // template so they still end in "| TFF Digital".
    title: seo?.title ? { absolute: title } : title,
    description,
    alternates: resolvedCanonical ? { canonical: resolvedCanonical } : undefined,
    robots: seo
      ? {
          index: seo.robots.index,
          follow: seo.robots.follow,
        }
      : undefined,
    openGraph: seo
      ? {
          title: seo.openGraph.title,
          description: seo.openGraph.description,
          type: seo.openGraph.type,
          url: resolvedCanonical,
          // A page-level openGraph replaces the root layout's wholesale, so
          // pages without a Yoast OG image must re-supply the sitewide card.
          images: seo.openGraph.image
            ? [{ url: seo.openGraph.image.url }]
            : seoConfig.defaultOgImage
              ? [{ url: seoConfig.defaultOgImage }]
              : undefined,
        }
      : undefined,
    twitter: seo
      ? {
          card: seo.twitter.card,
          title: seo.twitter.title,
          description: seo.twitter.description,
          images: seo.twitter.image ? [seo.twitter.image.url] : undefined,
        }
      : undefined,
  };

  return { ...metadata, ...overrides };
}
