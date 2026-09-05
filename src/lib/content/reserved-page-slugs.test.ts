import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  RESERVED_PAGE_SLUGS,
  filterReservedPageSlugs,
  isReservedPageSlug,
} from "./reserved-page-slugs.ts";

// CLIENT-1: a WordPress Page must never shadow an existing application
// route. Uses the repository's actual route list, not a guess — every
// static-route slug in RESERVED_PAGE_SLUGS must correspond to a real
// src/app/<slug>/page.tsx on disk, so this list can't silently drift from
// reality (mirrors service-routes.test.ts's own existsSync check).

const APP = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../app",
);

// Not a real route directory today — reserved only because ARCH-2
// deliberately keeps the Projects content type unclaimed at these URLs.
const ARCH2_RESERVED = new Set(["portfolio", "projects", "work"]);
const API_RESERVED = new Set(["api"]);

describe("RESERVED_PAGE_SLUGS matches the real route list", () => {
  for (const slug of RESERVED_PAGE_SLUGS) {
    if (ARCH2_RESERVED.has(slug) || API_RESERVED.has(slug)) continue;
    test(`${slug} has a real src/app/${slug}/page.tsx`, () => {
      assert.ok(
        existsSync(path.join(APP, slug, "page.tsx")),
        `RESERVED_PAGE_SLUGS claims "${slug}" is a real route, but no such page.tsx exists`,
      );
    });
  }

  test("every existing top-level static route is present in the list", () => {
    // The inverse check: nothing under src/app with its own page.tsx is
    // missing from the reserved list (a new static route added later and
    // forgotten here would otherwise be silently shadowable).
    const KNOWN_NON_PAGE_ENTRIES = new Set([
      "api",
      "[slug]",
      "layout.tsx",
      "page.tsx",
      "error.tsx",
      "global-error.tsx",
      "not-found.tsx",
      "globals.css",
      "sitemap.ts",
      "robots.ts",
      "manifest.ts",
      "favicon.ico",
      "icon.png",
      "apple-icon.png",
    ]);
    const entries = readdirSync(APP, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory() || KNOWN_NON_PAGE_ENTRIES.has(entry.name)) {
        continue;
      }
      if (!existsSync(path.join(APP, entry.name, "page.tsx"))) continue;
      assert.ok(
        RESERVED_PAGE_SLUGS.has(entry.name),
        `src/app/${entry.name}/page.tsx is a real route but is not reserved`,
      );
    }
  });
});

describe("isReservedPageSlug / filterReservedPageSlugs", () => {
  test("flags every known reserved slug", () => {
    for (const slug of [
      "about",
      "blog",
      "case-studies",
      "contact",
      "privacy-policy",
      "services",
      "terms-and-conditions",
      "thank-you",
      "cookie-policy",
      "api",
      "portfolio",
      "projects",
      "work",
    ]) {
      assert.equal(isReservedPageSlug(slug), true, slug);
    }
  });

  test("does not flag a legitimate new Page slug", () => {
    for (const slug of ["our-story", "faq", "careers", "home"]) {
      assert.equal(isReservedPageSlug(slug), false, slug);
    }
  });

  test("filterReservedPageSlugs drops only the reserved entries", () => {
    const items = [
      { slug: "about" },
      { slug: "our-story" },
      { slug: "portfolio" },
      { slug: "careers" },
    ];
    assert.deepEqual(filterReservedPageSlugs(items), [
      { slug: "our-story" },
      { slug: "careers" },
    ]);
  });

  test("filterReservedPageSlugs also drops an empty/falsy slug", () => {
    assert.deepEqual(filterReservedPageSlugs([{ slug: "" }, { slug: "ok" }]), [
      { slug: "ok" },
    ]);
  });
});
