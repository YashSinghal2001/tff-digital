import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// PERF-4: generateMetadata and the page body on all three WordPress detail
// routes independently invoked the identical by-slug lookup, and Next's
// fetch memoization never dedupes these calls (POST + AbortSignal both opt
// out of it) — so every render fetched the same content from WordPress
// twice. Fixed in 8f32eb0 by wrapping the five by-slug getters in React's
// cache(), which shares one in-flight/resolved promise per (function,
// slug) for the lifetime of a single request.
//
// cache()'s own deduplication cannot be exercised by this test: outside an
// active React render/request it is a documented passthrough (verified
// directly — calling a cache()-wrapped function twice with the same
// argument outside of React's request scope invokes the underlying
// function both times, since there is no AsyncLocalStorage-backed request
// store for it to key off). That behaviour was reproduced empirically
// instead, against a real `next build`: temporarily logging every
// fetchGraphQL call showed exactly one GetPostBySlug/GetCaseStudyBySlug/
// GetServiceBySlug invocation per prerendered slug (9 distinct by-slug
// lookups across blog, case studies and services, each appearing once) —
// matching the fix's own "2 → 1" claim, unregressed.
//
// What IS reliably checkable here, and is the actual regression this file
// guards against, is the two static contracts the fix depends on: (1) the
// getter stays wrapped in cache(), and (2) generateMetadata and the body
// still call that SAME function — silently swapping one of the two call
// sites to a different, uncached getter would reintroduce the duplicate
// fetch even with the wrapper still in place, and nothing else would catch
// it. Page files contain JSX and cannot be imported under this repo's
// `node --test` runner, so — as in service-routes.test.ts and
// perf1-static-generation.test.ts — the contract is read from source.
const APP = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "app",
);
const SERVICES = path.resolve(path.dirname(fileURLToPath(import.meta.url)));

const readSource = (dir: string, relativePath: string) =>
  readFileSync(path.join(dir, relativePath), "utf8");

const POST_SERVICE = readSource(SERVICES, "post.service.ts");
const CASE_STUDY_SERVICE = readSource(SERVICES, "case-study.service.ts");
const SERVICE_OFFERING_SERVICE = readSource(
  SERVICES,
  "service-offering.service.ts",
);

const BLOG_DETAIL_PAGE = readSource(APP, "blog/[slug]/page.tsx");
const CASE_STUDY_DETAIL_PAGE = readSource(APP, "case-studies/[slug]/page.tsx");
const SERVICE_DETAIL_PAGE = readSource(APP, "services/[slug]/page.tsx");

/** Counts calls to `name(` as a real invocation — not the `export const name
 *  = cache(` declaration itself, which this pattern also happens not to
 *  match since it requires the identifier be followed directly by `(`. */
function callCount(source: string, name: string): number {
  return (source.match(new RegExp(`\\b${name}\\(`, "g")) ?? []).length;
}

describe("by-slug getters stay wrapped in cache() (PERF-4)", () => {
  const wrapped: [string, string][] = [
    [POST_SERVICE, "getPostBySlug"],
    [CASE_STUDY_SERVICE, "getCaseStudyBySlug"],
    [CASE_STUDY_SERVICE, "getCaseStudyPreviewBySlug"],
    [SERVICE_OFFERING_SERVICE, "getServiceOfferingBySlug"],
    [SERVICE_OFFERING_SERVICE, "getServiceOfferingPreviewBySlug"],
  ];

  for (const [source, name] of wrapped) {
    test(`${name} is declared as \`export const ${name} = cache(\``, () => {
      assert.match(source, new RegExp(`export const ${name} = cache\\(`));
    });
  }
});

describe("generateMetadata and the page body call the same cached getter (PERF-4)", () => {
  test("blog: generateMetadata and the body both call getPostBySlug, nothing else", () => {
    assert.equal(callCount(BLOG_DETAIL_PAGE, "getPostBySlug"), 2);
  });

  test("case studies: generateMetadata and the body call the same published/preview pair", () => {
    assert.equal(callCount(CASE_STUDY_DETAIL_PAGE, "getCaseStudyBySlug"), 2);
    assert.equal(
      callCount(CASE_STUDY_DETAIL_PAGE, "getCaseStudyPreviewBySlug"),
      2,
    );
  });

  test("services: generateMetadata and the body call the same published/preview pair", () => {
    assert.equal(callCount(SERVICE_DETAIL_PAGE, "getServiceOfferingBySlug"), 2);
    assert.equal(
      callCount(SERVICE_DETAIL_PAGE, "getServiceOfferingPreviewBySlug"),
      2,
    );
  });
});

describe("cache() outside a request scope (documents why the dedup itself is untestable here)", () => {
  test("a cache()-wrapped function is a passthrough without a React request scope", async () => {
    const { cache } = await import("react");
    let calls = 0;
    const wrapped = cache((value: number) => {
      calls += 1;
      return value * 2;
    });
    wrapped(5);
    wrapped(5);
    assert.equal(
      calls,
      2,
      "no request scope here to memoize against — both calls run",
    );
  });
});
