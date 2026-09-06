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
  // Yoast's WPGraphQL bridge doesn't expose an og:type field, so callers
  // supply it directly — blog posts pass "article" (OG-2); everything else
  // defaults to "website".
  type?: "website" | "article";
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
    // wpSeo.canonical is Yoast's own canonical, resolved against the CMS
    // host (https://cms.tffdigital.com/...) — never the public frontend
    // domain (CANON-1), so it must never be used here even as a fallback.
    // Every route builds its own frontend canonical and passes it to
    // buildMetadata directly; `fallback.canonicalUrl` exists only for a
    // caller that wants to pre-resolve one through this adapter instead.
    canonicalUrl: fallback.canonicalUrl ?? null,
    openGraph: {
      title: wpSeo?.opengraphTitle || title,
      description: wpSeo?.opengraphDescription || description,
      image: ogImage,
      type: fallback.type ?? "website",
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
