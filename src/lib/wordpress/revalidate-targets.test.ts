import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { resolveRevalidationTargets } from "./revalidate-targets.ts";
import { REVALIDATE_CONTENT_TYPES } from "../../schemas/api/revalidate-webhook.schema.ts";

// CACHE-1: exactly which cached surfaces one WordPress change may refresh —
// the entry, its listings/homepage surfaces, the sitemap — and nothing
// site-wide. The webhook's blast radius is this table.

describe("resolveRevalidationTargets", () => {
  test("a service refreshes its page, the grid, the homepage and the sitemap", () => {
    assert.deepEqual(
      resolveRevalidationTargets({ type: "service", slug: "aeo-seo" }),
      [
        { path: "/services/aeo-seo" },
        { path: "/services" },
        { path: "/" },
        { path: "/sitemap.xml" },
      ],
    );
  });

  test("a case study refreshes its page, the listing, the homepage and the sitemap", () => {
    assert.deepEqual(
      resolveRevalidationTargets({ type: "case-study", slug: "chicabebo" }),
      [
        { path: "/case-studies/chicabebo" },
        { path: "/case-studies" },
        { path: "/" },
        { path: "/sitemap.xml" },
      ],
    );
  });

  test("a post refreshes its page, the index, both archive patterns and the sitemap", () => {
    assert.deepEqual(
      resolveRevalidationTargets({
        type: "post",
        slug: "seo-for-small-businesses",
      }),
      [
        { path: "/blog/seo-for-small-businesses" },
        { path: "/blog" },
        { path: "/blog/category/[slug]", kind: "page" },
        { path: "/blog/tag/[slug]", kind: "page" },
        { path: "/sitemap.xml" },
      ],
    );
  });

  test("never targets a layout-wide or root-pattern purge for any type", () => {
    for (const type of REVALIDATE_CONTENT_TYPES) {
      for (const target of resolveRevalidationTargets({ type, slug: "x" })) {
        assert.notEqual((target as { kind?: string }).kind, "layout");
        assert.ok(
          target.kind !== "page" || target.path.startsWith("/blog/"),
          `${type}: pattern revalidation limited to blog archives, got ${target.path}`,
        );
      }
    }
  });
});
