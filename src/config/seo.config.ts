import { siteConfig } from "@/config/site.config";

export const seoConfig = {
  defaultTitle: siteConfig.name,
  titleTemplate: `%s | ${siteConfig.name}`,
  // Same copy as the root layout's default metadata description — used here
  // as the last-resort fallback when WordPress SEO data has no metaDesc and
  // the content itself has no excerpt/summary, so the <meta description>
  // tag is never emitted empty.
  defaultDescription: "Digital growth agency — strategy, branding, and performance marketing.",
  twitterHandle: "",
  // Sitewide share card (see src/app/layout.tsx openGraph.images); pages with
  // their own Yoast OG image override it.
  defaultOgImage: "/og-image.png" as string | null,
} as const;
