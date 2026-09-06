import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { adaptSeo } from "./seo.adapter.ts";
import type { WPSeo } from "@/types/api/wp-seo";

// The WordPress → domain boundary for canonical URLs (CANON-1). Yoast's
// canonical field resolves against the CMS host (cms.tffdigital.com), never
// the public frontend — every route builds its own frontend canonical via
// getCanonicalUrl() and passes it straight to buildMetadata, so this field
// must never leak into the domain object callers could mistake for one.

const wpSeoFixture: WPSeo = {
  title: null,
  metaDesc: null,
  canonical: "https://cms.tffdigital.com/blog/some-post/",
  opengraphTitle: null,
  opengraphDescription: null,
  opengraphImage: null,
  twitterTitle: null,
  twitterDescription: null,
  twitterImage: null,
  metaRobotsNoindex: null,
  metaRobotsNofollow: null,
  schema: null,
};

// IDX-1: this is the single place Yoast's metaRobotsNoindex/metaRobotsNofollow
// strings (every other value WPGraphQL can send, including null/unset, means
// "no restriction") get turned into the boolean robots directive every route's
// generateMetadata forwards to Next — so a regression here would silently
// de-index or wrongly index every WordPress-backed page with no other signal
// catching it.
describe("adaptSeo robots (IDX-1)", () => {
  test('index is false only when Yoast sends the literal "noindex"', () => {
    const seo = adaptSeo(
      { ...wpSeoFixture, metaRobotsNoindex: "noindex" },
      { title: "Post", description: "" },
    );
    assert.equal(seo.robots.index, false);
  });

  test("index is true when Yoast has no noindex directive set", () => {
    const seo = adaptSeo(
      { ...wpSeoFixture, metaRobotsNoindex: null },
      { title: "Post", description: "" },
    );
    assert.equal(seo.robots.index, true);
  });

  test('index is true for any Yoast value other than "noindex" (e.g. "index")', () => {
    const seo = adaptSeo(
      { ...wpSeoFixture, metaRobotsNoindex: "index" },
      { title: "Post", description: "" },
    );
    assert.equal(seo.robots.index, true);
  });

  test('follow is false only when Yoast sends the literal "nofollow"', () => {
    const seo = adaptSeo(
      { ...wpSeoFixture, metaRobotsNofollow: "nofollow" },
      { title: "Post", description: "" },
    );
    assert.equal(seo.robots.follow, false);
  });

  test("follow is true when Yoast has no nofollow directive set", () => {
    const seo = adaptSeo(
      { ...wpSeoFixture, metaRobotsNofollow: null },
      { title: "Post", description: "" },
    );
    assert.equal(seo.robots.follow, true);
  });

  test("a content item with no WordPress SEO object at all defaults to index, follow", () => {
    const seo = adaptSeo(null, { title: "Post", description: "" });
    assert.deepEqual(seo.robots, { index: true, follow: true });
  });
});

describe("adaptSeo canonicalUrl (CANON-1)", () => {
  test("never surfaces Yoast's CMS-host canonical, even with no fallback", () => {
    const seo = adaptSeo(wpSeoFixture, { title: "Post", description: "" });
    assert.equal(seo.canonicalUrl, null);
  });

  test("a caller-supplied fallback canonical wins over Yoast's CMS-host value", () => {
    const seo = adaptSeo(wpSeoFixture, {
      title: "Post",
      description: "",
      canonicalUrl: "https://www.tffdigital.com/blog/some-post",
    });
    assert.equal(seo.canonicalUrl, "https://www.tffdigital.com/blog/some-post");
  });

  test("resolves to null when neither Yoast nor the caller has one", () => {
    const seo = adaptSeo(null, { title: "Post", description: "" });
    assert.equal(seo.canonicalUrl, null);
  });
});
