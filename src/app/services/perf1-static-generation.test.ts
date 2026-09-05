import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// PERF-1: /services/[slug] was the only WordPress detail route with no
// generateStaticParams, so every visit was an uncached live round-trip
// (live-measured at 2-4x the TTFB of the ISR routes). Fixed in 8f32eb0 by
// prerendering every known slug and inheriting the fetch client's 30s ISR
// window, the same mechanism blog and case studies already used. This pins
// that source contract so a later edit can't silently drop it — page files
// contain JSX and cannot be imported/executed under this repo's `node --test`
// runner, so the fix is verified by reading the source, the same technique
// already used by ./service-routes.test.ts.
const APP = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(APP, "../..");

const readSource = (relativePath: string) =>
  readFileSync(path.join(SRC, relativePath), "utf8");

const SERVICE_DETAIL_PAGE = readSource("app/services/[slug]/page.tsx");
const BLOG_DETAIL_PAGE = readSource("app/blog/[slug]/page.tsx");
const CASE_STUDY_DETAIL_PAGE = readSource("app/case-studies/[slug]/page.tsx");
const WORDPRESS_CLIENT = readSource("lib/wordpress/client.ts");

describe("service detail pages are prerendered with ISR (PERF-1)", () => {
  test("exports generateStaticParams", () => {
    assert.match(
      SERVICE_DETAIL_PAGE,
      /export async function generateStaticParams\(\)/,
    );
  });

  test("prerenders from the soft (non-throwing) service list getter", () => {
    // Using the strict/throwing variant here would fail the entire Vercel
    // build on a build-time CMS outage instead of degrading to dynamicParams.
    const fn = SERVICE_DETAIL_PAGE.slice(
      SERVICE_DETAIL_PAGE.indexOf("export async function generateStaticParams"),
      SERVICE_DETAIL_PAGE.indexOf("generateMetadata"),
    );
    assert.match(fn, /await getServiceOfferings\(/);
    assert.doesNotMatch(fn, /Strict\(/);
  });

  test("filters out any malformed entry with no slug", () => {
    const fn = SERVICE_DETAIL_PAGE.slice(
      SERVICE_DETAIL_PAGE.indexOf("export async function generateStaticParams"),
      SERVICE_DETAIL_PAGE.indexOf("generateMetadata"),
    );
    assert.match(fn, /\.filter\(\(service\) => service\.slug\)/);
  });

  test("does not override revalidate or dynamicParams — inherits the fetch-level 30s ISR window", () => {
    // No `export const revalidate`/`dynamicParams` in ANY of the three
    // detail routes: all three rely on the WordPress client's default
    // `{ revalidate: 30 }` (see client.ts below) and the App Router's
    // default `dynamicParams = true`, so a slug published after the last
    // build still renders on demand instead of 404ing.
    for (const source of [
      SERVICE_DETAIL_PAGE,
      BLOG_DETAIL_PAGE,
      CASE_STUDY_DETAIL_PAGE,
    ]) {
      assert.doesNotMatch(source, /export const revalidate/);
      assert.doesNotMatch(source, /export const dynamicParams/);
    }
  });

  test("the fetch client's default ISR window is 30 seconds", () => {
    assert.match(WORDPRESS_CLIENT, /revalidate: 30/);
  });

  test("services/[slug] has full parity with the other prerendered detail routes", () => {
    // Same shape as blog/case-studies: a generateStaticParams built on a
    // soft, non-throwing list getter, mapping to { slug }.
    assert.match(
      BLOG_DETAIL_PAGE,
      /export async function generateStaticParams\(\)/,
    );
    assert.match(
      CASE_STUDY_DETAIL_PAGE,
      /export async function generateStaticParams\(\)/,
    );
    assert.match(BLOG_DETAIL_PAGE, /await getPosts\(/);
    assert.match(CASE_STUDY_DETAIL_PAGE, /await getCaseStudies\(/);
  });
});
