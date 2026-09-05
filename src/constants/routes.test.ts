import assert from "node:assert/strict";
import test, { afterEach, describe, mock } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import { ROUTES } from "./routes.ts";

// ARCH-2: the Portfolio/Projects data layer (src/services/portfolio.service.ts
// and its repository/adapter/query/types/mock) is kept dormant by decision.
// This pins the public surface: no route directory, no ROUTES entry, no
// static sitemap location, no navigation, footer or redirect target may
// point at /portfolio, /projects or /work. (The homepage "Work" nav link is
// an in-page anchor, /#work, which is not a route.)
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";
process.env.WORDPRESS_USE_MOCK_DATA = "";

const { getAllSitemapEntries } = await import("../lib/seo/sitemap.ts");

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const DORMANT_PATH = /^\/(portfolio|projects|work)(\/|$)/;
// Anything that could hand a visitor a link or a redirect: the header, the
// footer (and its link table where one exists), and the Next config with its
// redirect table. Read as source so .tsx files need no JSX transform.
const LINK_SURFACE_SOURCES = [
  "src/components/layout/Navbar.tsx",
  "src/components/layout/Footer.tsx",
  "src/components/layout/footer-links.ts",
  "next.config.ts",
  "src/constants/redirects.ts",
];
const DORMANT_SOURCE_REF =
  /ROUTES\.portfolio|["'`]\/(portfolio|projects|work)\b/;

const isDormant = (href: string) => DORMANT_PATH.test(href);

describe("dormant portfolio surface (ARCH-2)", () => {
  afterEach(() => mock.restoreAll());

  test("no /portfolio, /projects or /work route exists under src/app", () => {
    for (const segment of ["portfolio", "projects", "work"]) {
      assert.ok(
        !existsSync(path.join(ROOT, "src/app", segment)),
        `src/app/${segment} would make the dormant layer public`,
      );
    }
  });

  test("ROUTES advertises no portfolio URL", () => {
    const hrefs = Object.values(ROUTES).map((route) =>
      typeof route === "function" ? route("x") : route,
    );
    assert.deepEqual(hrefs.filter(isDormant), []);
    assert.ok(!("portfolio" in ROUTES) && !("portfolioItem" in ROUTES));
  });

  test("the sitemap's static routes emit no portfolio location", async () => {
    mock.method(console, "error", () => {});
    mock.method(globalThis, "fetch", async () => {
      throw new TypeError("fetch failed");
    });
    const entries = await getAllSitemapEntries();
    assert.ok(entries.length > 0);
    assert.deepEqual(
      entries.map((entry) => new URL(entry.url).pathname).filter(isDormant),
      [],
    );
  });

  test("navigation, footer and redirects never target a portfolio URL", () => {
    const checked = LINK_SURFACE_SOURCES.filter((file) =>
      existsSync(path.join(ROOT, file)),
    );
    assert.ok(checked.length >= 3, "link-surface sources missing");
    for (const file of checked) {
      assert.doesNotMatch(
        readFileSync(path.join(ROOT, file), "utf8"),
        DORMANT_SOURCE_REF,
        `${file} references a dormant portfolio URL`,
      );
    }
  });
});
