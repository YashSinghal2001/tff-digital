import assert from "node:assert/strict";
import test, { describe } from "node:test";

import type { Seo } from "@/types/domain/seo";
import {
  SITE_OPEN_GRAPH_DEFAULTS,
  buildMetadata,
  buildPageOpenGraph,
} from "./metadata.ts";

// OG-1: og:url is the one OpenGraph field Next.js never derives from
// alternates.canonical or inherits from the root layout, so every public
// page with a canonical must set openGraph.url itself — and to exactly the
// canonical, so the two can never diverge.

const CANONICAL = "https://www.example.test/about";

const seoFixture: Seo = {
  title: "About - Example",
  description: "About us.",
  canonicalUrl: null,
  openGraph: {
    title: "About - Example",
    description: "About us.",
    image: null,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About - Example",
    description: "About us.",
    image: null,
  },
  robots: { index: true, follow: true },
  jsonLd: null,
};

describe("buildPageOpenGraph", () => {
  test("sets og:url to the canonical it is given", () => {
    assert.equal(buildPageOpenGraph(CANONICAL)?.url, CANONICAL);
  });

  test("re-supplies the sitewide card alongside the URL", () => {
    // A page-level openGraph replaces the layout's wholesale, so anything
    // missing here would be missing from the rendered page.
    assert.deepEqual(buildPageOpenGraph(CANONICAL), {
      ...SITE_OPEN_GRAPH_DEFAULTS,
      url: CANONICAL,
    });
  });
});

describe("buildMetadata og:url", () => {
  test("matches the canonical when the item carries SEO data", () => {
    const metadata = buildMetadata(seoFixture, CANONICAL);
    assert.equal(metadata.alternates?.canonical, CANONICAL);
    assert.equal(metadata.openGraph?.url, CANONICAL);
  });

  test("matches the canonical when the item has no SEO data", () => {
    const metadata = buildMetadata(null, CANONICAL, { title: "About" });
    assert.equal(metadata.alternates?.canonical, CANONICAL);
    assert.deepEqual(metadata.openGraph, {
      ...SITE_OPEN_GRAPH_DEFAULTS,
      url: CANONICAL,
    });
  });

  test("falls back to the SEO canonical when no route canonical is given", () => {
    const metadata = buildMetadata({ ...seoFixture, canonicalUrl: CANONICAL });
    assert.equal(metadata.alternates?.canonical, CANONICAL);
    assert.equal(metadata.openGraph?.url, CANONICAL);
  });

  test("leaves openGraph to the root layout when there is no canonical at all", () => {
    // Setting the key (even to undefined) would stop the layout's default
    // card from flowing through; an absent key is the inheritance signal.
    const metadata = buildMetadata(null, undefined, { title: "Draft" });
    assert.equal("openGraph" in metadata, false);
    assert.equal("alternates" in metadata, false);
  });

  test("keeps the caller's overrides ahead of the built fields", () => {
    const metadata = buildMetadata(null, CANONICAL, undefined, {
      robots: { index: false, follow: false },
    });
    assert.deepEqual(metadata.robots, { index: false, follow: false });
    assert.equal(metadata.openGraph?.url, CANONICAL);
  });
});
