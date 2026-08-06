import type { Metadata } from "next";
import type { Seo } from "@/types/domain/seo";
import { seoConfig } from "@/config/seo.config";

export function buildMetadata(
  seo: Seo | null,
  overrides?: Partial<Metadata>,
): Metadata {
  const title = seo?.title || seoConfig.defaultTitle;
  const description = seo?.description || seoConfig.defaultDescription;

  const metadata: Metadata = {
    title,
    description,
    alternates: seo?.canonicalUrl ? { canonical: seo.canonicalUrl } : undefined,
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
