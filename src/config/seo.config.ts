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

// Client-provided meta title/description for these six service pages
// (source: "Meta Titles & Descriptions.pdf"), verbatim — wins over CMS/Yoast
// SEO data via buildMetadata's `overrides` param. Only <title>/<meta
// description> are affected; OG/Twitter/robots/canonical stay CMS-driven.
export const SERVICE_META_OVERRIDES: Record<string, { title: string; description: string }> = {
  "aeo-seo": {
    title: "AEO & SEO Services | Rank on Google & AI Search | TFF Digital",
    description:
      "Get found on Google and AI tools like ChatGPT & Gemini. Technical SEO, content strategy, local SEO & Answer Engine Optimization built for sustainable growth.",
  },
  smm: {
    title: "Social Media Marketing (SMM) Services | TFF Digital",
    description:
      "Build a recognizable brand and turn social attention into business growth with strategic content planning, creative direction & platform management.",
  },
  "meta-ads": {
    title: "Meta Ads Management | Facebook & Instagram Ads | TFF Digital",
    description:
      "Strategic Facebook & Instagram ad campaigns built to generate leads, sales & measurable ROI. Audience targeting, creative strategy & retargeting.",
  },
  "web-development": {
    title: "Website Design & Development Services | TFF Digital",
    description:
      "Fast, modern, conversion-focused websites built to turn visitors into customers. Responsive design, SEO-friendly builds & high-performing UX.",
  },
  "video-editing": {
    title: "Video Editing Services | Reels, Shorts & Ads | TFF Digital",
    description:
      "Scroll-stopping video editing for Reels, YouTube Shorts & social ads. Strong hooks, clean storytelling & platform-ready formats that drive action.",
  },
  "zoho-one": {
    title: "ZOHO One Implementation & CRM Setup | TFF Digital",
    description:
      "Connect sales, marketing, support & operations in one platform. Expert ZOHO One setup, CRM implementation & workflow automation for growing teams.",
  },
};
