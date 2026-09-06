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

describe("buildMetadata OG-2 site identity + locale", () => {
  test("re-supplies og:site_name and og:locale on every WP-backed item, not just the no-SEO fallback", () => {
    // The page-level openGraph object replaces the root layout's wholesale,
    // so a WP post/case-study/service/page (the `if (seo)` branch) must
    // carry these itself — they were silently missing live before OG-2.
    const metadata = buildMetadata(seoFixture, CANONICAL);
    assert.equal(metadata.openGraph?.siteName, SITE_OPEN_GRAPH_DEFAULTS.siteName);
    assert.equal(metadata.openGraph?.locale, SITE_OPEN_GRAPH_DEFAULTS.locale);
  });
});

describe("buildMetadata OG-2 image + type consistency", () => {
  test("carries a WP-sourced image's width/height/alt into og:image, not just its url", () => {
    const metadata = buildMetadata(
      {
        ...seoFixture,
        openGraph: {
          ...seoFixture.openGraph,
          image: {
            id: "1",
            url: "https://cms.example.test/photo.jpg",
            altText: "A photo",
            width: 800,
            height: 600,
          },
        },
      },
      CANONICAL,
    );
    assert.deepEqual(metadata.openGraph?.images, [
      { url: "https://cms.example.test/photo.jpg", alt: "A photo", width: 800, height: 600 },
    ]);
  });

  test("falls back og:image alt to the og:title when the media has none", () => {
    const metadata = buildMetadata(
      {
        ...seoFixture,
        openGraph: {
          ...seoFixture.openGraph,
          image: {
            id: "1",
            url: "https://cms.example.test/photo.jpg",
            altText: "",
            width: null,
            height: null,
          },
        },
      },
      CANONICAL,
    );
    assert.deepEqual(metadata.openGraph?.images, [
      { url: "https://cms.example.test/photo.jpg", alt: seoFixture.openGraph.title },
    ]);
  });

  test("passes og:type through from the adapted SEO data (article for blog posts)", () => {
    const metadata = buildMetadata(
      { ...seoFixture, openGraph: { ...seoFixture.openGraph, type: "article" } },
      CANONICAL,
    );
    // Metadata["openGraph"] is a discriminated union keyed on `type`; only
    // some members declare it, so a type-narrowed read needs the cast.
    assert.equal((metadata.openGraph as { type?: string } | undefined)?.type, "article");
  });
});

// IDX-1: buildMetadata is the only place a WP item's adapted robots
// directive (from adaptSeo, see seo.adapter.test.ts) reaches Next's
// <meta name="robots"> output, so the pass-through itself needs its own
// regression coverage independent of the caller-supplied `overrides` path
// already covered above.
describe("buildMetadata robots (IDX-1)", () => {
  test("carries a noindex directive from the adapted SEO data through to metadata.robots", () => {
    const metadata = buildMetadata(
      { ...seoFixture, robots: { index: false, follow: true } },
      CANONICAL,
    );
    assert.deepEqual(metadata.robots, { index: false, follow: true });
  });

  test("carries an indexable directive from the adapted SEO data through to metadata.robots", () => {
    const metadata = buildMetadata(
      { ...seoFixture, robots: { index: true, follow: true } },
      CANONICAL,
    );
    assert.deepEqual(metadata.robots, { index: true, follow: true });
  });

  test("sets no robots field at all when the item has no SEO data, so the indexable root-layout default is inherited rather than overridden", () => {
    const metadata = buildMetadata(null, CANONICAL, { title: "Untitled" });
    assert.equal("robots" in metadata, false);
  });
});
