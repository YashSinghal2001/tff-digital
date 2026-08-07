import type { Metadata } from "next";
import type { Seo } from "@/types/domain/seo";
import { seoConfig } from "@/config/seo.config";

export function buildMetadata(
  seo: Seo | null,
  canonicalUrl?: string,
  overrides?: Partial<Metadata>,
): Metadata {
  const title = seo?.title || seoConfig.defaultTitle;
  const description = seo?.description || seoConfig.defaultDescription;
  const resolvedCanonical = canonicalUrl ?? seo?.canonicalUrl ?? undefined;

  const metadata: Metadata = {
    // WordPress SEO titles (Yoast) already include the site name, so this
    // must bypass the root layout's `%s | ${siteName}` template — otherwise
    // every WP-sourced title gets the site name appended twice.
    title: seo ? { absolute: title } : title,
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
          images: seo.openGraph.image
            ? [{ url: seo.openGraph.image.url }]
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
