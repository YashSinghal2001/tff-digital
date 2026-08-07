import type { WPSeo } from "@/types/api/wp-seo";
import type { Seo } from "@/types/domain/seo";
import { adaptMedia } from "@/adapters/media.adapter";
import { stripHtml } from "@/lib/content/post-content";

function isIndexable(metaRobotsNoindex: string | null | undefined): boolean {
  return metaRobotsNoindex !== "noindex";
}

function isFollowable(metaRobotsNofollow: string | null | undefined): boolean {
  return metaRobotsNofollow !== "nofollow";
}

function parseJsonLd(
  raw: string | null | undefined,
): Record<string, unknown> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export interface SeoFallback {
  title: string;
  description: string;
  canonicalUrl?: string | null;
}

export function adaptSeo(wpSeo: WPSeo | null, fallback: SeoFallback): Seo {
  const title = wpSeo?.title || fallback.title;
  // fallback.description often comes from a WP excerpt/summary field, which
  // can carry raw HTML (e.g. "<p>...</p>") — strip it so a <meta
  // description> never renders literal markup when Yoast's metaDesc is unset.
  const fallbackDescription = stripHtml(fallback.description).replace(/\s+/g, " ").trim();
  const description = wpSeo?.metaDesc || fallbackDescription;
  const ogImage = wpSeo?.opengraphImage
    ? adaptMedia(wpSeo.opengraphImage)
    : null;
  const twitterImage = wpSeo?.twitterImage
    ? adaptMedia(wpSeo.twitterImage)
    : null;

  return {
    title,
    description,
    canonicalUrl: wpSeo?.canonical ?? fallback.canonicalUrl ?? null,
    openGraph: {
      title: wpSeo?.opengraphTitle || title,
      description: wpSeo?.opengraphDescription || description,
      image: ogImage,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: wpSeo?.twitterTitle || title,
      description: wpSeo?.twitterDescription || description,
      image: twitterImage,
    },
    robots: {
      index: isIndexable(wpSeo?.metaRobotsNoindex),
      follow: isFollowable(wpSeo?.metaRobotsNofollow),
    },
    jsonLd: parseJsonLd(wpSeo?.schema?.raw),
  };
}
