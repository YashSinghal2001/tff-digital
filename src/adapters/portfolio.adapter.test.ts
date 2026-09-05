import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { adaptPortfolioItem } from "./portfolio.adapter.ts";
import type { WPPortfolioItem } from "@/types/api/wp-portfolio";

// PARTIAL-1 named portfolio.adapter.ts's categories read as one of the six
// unguarded `.nodes` accesses. The layer is dormant (ARCH-2), but the guard
// is production code and this pins it: null, a connection without `.nodes`,
// empty nodes, and populated nodes. Runtime `@/` imports resolve under
// `node --test` via test/hooks.mjs.
const base: WPPortfolioItem = {
  id: "cG9ydGZvbGlvOjE=",
  slug: "acme-rebrand",
  title: "Acme Rebrand",
  content: "<p>Body.</p>",
  summary: "Summary.",
  client: "Acme Co.",
  featuredImage: null,
  gallery: null,
  categories: null,
  seo: null,
};

const withCategories = (categories: unknown) =>
  adaptPortfolioItem({
    ...base,
    categories: categories as WPPortfolioItem["categories"],
  }).categories;

describe("adaptPortfolioItem — categories connection (PARTIAL-1)", () => {
  test("null categories adapt to an empty list", () => {
    assert.deepEqual(withCategories(null), []);
  });

  test("a categories connection returned without .nodes adapts to an empty list", () => {
    // Before the fix: TypeError: Cannot read properties of undefined (reading 'map')
    assert.deepEqual(withCategories({}), []);
  });

  test("empty nodes adapt to an empty list", () => {
    assert.deepEqual(withCategories({ nodes: [] }), []);
  });

  test("populated nodes adapt through the category adapter", () => {
    assert.deepEqual(
      withCategories({
        nodes: [{ id: "c1", name: "Branding", slug: "branding", count: null }],
      }),
      [{ id: "c1", name: "Branding", slug: "branding", count: 0 }],
    );
  });

  test("null gallery and media still adapt safely alongside", () => {
    const item = adaptPortfolioItem(base);
    assert.deepEqual(item.gallery, []);
    assert.equal(item.featuredImage, null);
    assert.equal(item.client, "Acme Co.");
  });
});
