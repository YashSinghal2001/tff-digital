import type { Metadata } from "next";
import type { Seo } from "@/types/domain/seo";
import { seoConfig } from "@/config/seo.config";
import { siteConfig } from "@/config/site.config";

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
    };
    metadata.twitter = {
      card: seo.twitter.card,
      title: seo.twitter.title,
      description: seo.twitter.description,
      images: seo.twitter.image ? [seo.twitter.image.url] : undefined,
    };
  }

  return { ...metadata, ...overrides };
}
