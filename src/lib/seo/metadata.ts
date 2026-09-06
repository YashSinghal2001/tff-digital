import type { Metadata } from "next";
import type { Seo } from "@/types/domain/seo";
import type { Media } from "@/types/domain/media";
import { seoConfig } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";

/** Resolves a WordPress media item into an OG/Twitter image descriptor
 *  (OG-2) — width/height/alt are only known for WP-sourced images, so a
 *  bare `{ url }` (as before) silently dropped data crawlers use to render
 *  the share card without a layout flash. */
function toShareImage(media: Media, altFallback: string) {
  return {
    url: media.url,
    alt: media.altText || altFallback,
    ...(media.width && media.height
      ? { width: media.width, height: media.height }
      : {}),
  };
}

/** Sitewide OpenGraph defaults — single source for the root layout and
 *  buildPageOpenGraph, so the share card can't drift between them. */
export const SITE_OPEN_GRAPH_DEFAULTS = {
  siteName: siteConfig.name,
  type: "website",
  locale: siteConfig.defaultLocale,
  images: [
    {
      url: "/og-image.png",
      width: 1200,
      height: 630,
      alt: `${siteConfig.name} — Digital Growth Agency`,
    },
  ],
} satisfies Metadata["openGraph"];

/** OpenGraph block for pages without WordPress SEO data (OG-1). A page-level
 *  `openGraph` replaces the root layout's wholesale, so this re-supplies the
 *  sitewide defaults alongside the page's own URL; og:title/og:description
 *  still fall back to the page's resolved title/description. Pass the same
 *  value as `alternates.canonical` so og:url can never diverge from it. */
export function buildPageOpenGraph(
  canonicalUrl: string,
): Metadata["openGraph"] {
  return { ...SITE_OPEN_GRAPH_DEFAULTS, url: canonicalUrl };
}

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
  };

  // Fields are added only when they carry a value. Next.js treats an
  // explicitly-undefined field as "defined as nothing" and stops inheriting
  // the parent segment's value for it — so `openGraph: undefined` here
  // silently stripped the root layout's default OG/Twitter card from every
  // page without Yoast SEO data (observed live on case-study pages with
  // seo: null). Omitting the keys lets the layout defaults flow through.
  if (resolvedCanonical) {
    metadata.alternates = { canonical: resolvedCanonical };
  }

  if (seo) {
    metadata.robots = {
      index: seo.robots.index,
      follow: seo.robots.follow,
    };
    metadata.openGraph = {
      // A page-level openGraph replaces the root layout's wholesale, so a
      // WP-backed page must re-supply site identity/locale itself (OG-2) —
      // Yoast has no equivalent fields, and without this every post/case
      // study/service/page shipped og:image with no og:site_name or
      // og:locale at all, live-confirmed on /services and /case-studies.
      siteName: SITE_OPEN_GRAPH_DEFAULTS.siteName,
      locale: SITE_OPEN_GRAPH_DEFAULTS.locale,
      title: seo.openGraph.title,
      description: seo.openGraph.description,
      type: seo.openGraph.type,
      url: resolvedCanonical,
      images: seo.openGraph.image
        ? [toShareImage(seo.openGraph.image, seo.openGraph.title)]
        : seoConfig.defaultOgImage
          ? [{ url: seoConfig.defaultOgImage }]
          : undefined,
    };
    metadata.twitter = {
      card: seo.twitter.card,
      title: seo.twitter.title,
      description: seo.twitter.description,
      images: seo.twitter.image
        ? [toShareImage(seo.twitter.image, seo.twitter.title)]
        : undefined,
    };
  } else if (resolvedCanonical) {
    // og:url is the one OpenGraph field the root layout can never supply
    // (it is per-page), so an item without SEO data would otherwise inherit
    // the sitewide card with no URL at all (OG-1). Re-supply the identical
    // defaults plus the page's canonical so the two can never diverge.
    metadata.openGraph = buildPageOpenGraph(resolvedCanonical);
  }

  return { ...metadata, ...overrides };
}
