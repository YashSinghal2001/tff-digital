import assert from "node:assert/strict";
import test, { describe } from "node:test";

import type { Seo } from "@/types/domain/seo";
import { buildMetadata } from "@/lib/seo/metadata.ts";
import { SERVICE_META_OVERRIDES } from "./seo.config.ts";

// Client-provided copy ("Meta Titles & Descriptions.pdf") for the six
// service landing pages — verbatim, not to be edited here without the
// client re-supplying new values.
const EXPECTED: Record<string, { title: string; description: string }> = {
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

describe("SERVICE_META_OVERRIDES", () => {
  test("carries exactly the six client-provided slugs with exact copy", () => {
    assert.deepEqual(SERVICE_META_OVERRIDES, EXPECTED);
  });
});

const seoFixture: Seo = {
  title: "WP Yoast title that should be beaten",
  description: "WP Yoast description that should be beaten",
  canonicalUrl: null,
  openGraph: {
    title: "WP OG title",
    description: "WP OG description",
    image: null,
    type: "website",
  },
  twitter: { card: "summary_large_image", title: "WP tw title", description: "WP tw desc", image: null },
  robots: { index: true, follow: true },
  jsonLd: null,
};

describe("buildMetadata with a SERVICE_META_OVERRIDES entry", () => {
  const CANONICAL = "https://www.tffdigital.com/services/aeo-seo";
  const override = SERVICE_META_OVERRIDES["aeo-seo"];
  const metadata = buildMetadata(
    seoFixture,
    CANONICAL,
    { title: "Fallback title", description: "Fallback description" },
    { title: { absolute: override.title }, description: override.description },
  );

  test("title/description win over CMS/Yoast data", () => {
    assert.deepEqual(metadata.title, { absolute: override.title });
    assert.equal(metadata.description, override.description);
  });

  test("OG/Twitter/robots/canonical stay CMS-driven, untouched by the override", () => {
    assert.equal(metadata.openGraph?.title, seoFixture.openGraph.title);
    assert.equal(metadata.twitter?.title, seoFixture.twitter.title);
    assert.deepEqual(metadata.robots, { index: true, follow: true });
    assert.equal(metadata.alternates?.canonical, CANONICAL);
  });
});
