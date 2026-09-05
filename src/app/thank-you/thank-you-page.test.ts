import assert from "node:assert/strict";
import test, { afterEach, describe, mock } from "node:test";
import { readFileSync } from "node:fs";

import { ROUTES } from "@/constants/routes";

// CLIENT-2: a dedicated, directly-navigable Thank You route the contact form
// redirects to on success (see contact-form-success.test.ts for the redirect
// itself). Pins the page's metadata (noindex — a confirmation step, not
// content worth ranking — but still fully reachable) and that it carries no
// dynamic/user-supplied data that could leak anything sensitive.

const SOURCE = readFileSync(
  new URL("./page.tsx", import.meta.url),
  "utf8",
);

describe("Thank You page (CLIENT-2)", () => {
  test("ROUTES.thankYou points at /thank-you", () => {
    assert.equal(ROUTES.thankYou, "/thank-you");
  });

  test("is excluded from search indexing but still crawlable/followable", () => {
    assert.match(SOURCE, /robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
  });

  test("carries a canonical URL and OpenGraph block like other static pages", () => {
    assert.match(SOURCE, /alternates: \{ canonical: getCanonicalUrl\(ROUTES\.thankYou\) \}/);
    assert.match(SOURCE, /buildPageOpenGraph\(getCanonicalUrl\(ROUTES\.thankYou\)\)/);
  });

  test("has a static, non-dynamic title and description (no reflected user input)", () => {
    assert.match(SOURCE, /title: "Thank You"/);
    assert.doesNotMatch(SOURCE, /searchParams/);
    assert.doesNotMatch(SOURCE, /useSearchParams/);
  });

  test("renders a real confirmation heading and a way back, via the shared PageHero", () => {
    assert.match(SOURCE, /import \{ PageHero \} from "@\/components\/common\/PageHero";/);
    assert.match(SOURCE, /Thanks for reaching/);
    assert.match(SOURCE, /href: ROUTES\.home/);
  });
});

describe("the Thank You route is intentionally kept out of the sitemap", () => {
  afterEach(() => mock.restoreAll());

  test("getAllSitemapEntries never lists /thank-you", async () => {
    process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";
    process.env.WORDPRESS_USE_MOCK_DATA = "";
    mock.method(console, "error", () => {});
    mock.method(globalThis, "fetch", async () => {
      throw new TypeError("fetch failed");
    });

    const { getAllSitemapEntries } = await import("@/lib/seo/sitemap");
    const entries = await getAllSitemapEntries();
    assert.ok(entries.length > 0);
    assert.deepEqual(
      entries
        .map((entry) => new URL(entry.url).pathname)
        .filter((pathname) => pathname === ROUTES.thankYou),
      [],
    );
  });
});
