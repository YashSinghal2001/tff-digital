import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// CLIENT-1: the generic WordPress Page route contains JSX and cannot be
// imported/executed under this repo's `node --test` runner (established
// limitation — see the other detail routes' own *-route.test.ts / source-
// contract tests). This reads the real source and asserts on it, pinning
// exactly the contract the acceptance criteria depend on: reserved-slug
// refusal in every code path, the soft list fetcher in
// generateStaticParams, the shared metadata builder, and that the only
// dangerouslySetInnerHTML sink in the app (ArticleContent) is fed through
// the same sanitized field the adapter already sanitizes (ARCH-5) —
// nothing here re-renders page.content through a second, unsanitized path.

const SOURCE = readFileSync(
  path.join(path.dirname(fileURLToPath(import.meta.url)), "page.tsx"),
  "utf8",
);

describe("generic Page route (CLIENT-1)", () => {
  test("generateStaticParams uses the soft list fetcher, filtered by the reserved-slug guard", () => {
    const fn = SOURCE.slice(
      SOURCE.indexOf("export async function generateStaticParams"),
      SOURCE.indexOf("export async function generateMetadata"),
    );
    assert.match(fn, /await getPages\(\)/);
    assert.match(fn, /!isReservedPageSlug\(page\.slug\)/);
  });

  test("generateMetadata refuses a reserved slug before ever calling WordPress", () => {
    const fn = SOURCE.slice(
      SOURCE.indexOf("export async function generateMetadata"),
      SOURCE.indexOf("export default async function"),
    );
    const reservedCheckIndex = fn.indexOf("isReservedPageSlug(slug)");
    const fetchIndex = fn.indexOf("getPageBySlug(slug)");
    assert.ok(reservedCheckIndex > -1 && fetchIndex > -1);
    assert.ok(
      reservedCheckIndex < fetchIndex,
      "the reserved-slug check must run before the WordPress fetch",
    );
    assert.match(fn, /return \{\};/);
  });

  test("generateMetadata reuses the shared buildMetadata helper, not a bespoke implementation", () => {
    assert.match(
      SOURCE,
      /buildMetadata\(page\.seo, getCanonicalUrl\(ROUTES\.page\(slug\)\), \{/,
    );
  });

  test("the default export refuses a reserved slug, and 404s an unknown one, before rendering", () => {
    const fn = SOURCE.slice(SOURCE.indexOf("export default async function"));
    assert.match(fn, /if \(isReservedPageSlug\(slug\)\) notFound\(\);/);
    assert.match(fn, /if \(!page\) notFound\(\);/);
  });

  test("the by-slug fetch is not wrapped in try/catch in the body — a CMS outage must reach the error boundary", () => {
    const fn = SOURCE.slice(SOURCE.indexOf("export default async function"));
    assert.doesNotMatch(fn, /try\s*\{[\s\S]*getPageBySlug/);
  });

  test("page.content only ever reaches ArticleContent, the app's one sanitized rich-text sink", () => {
    assert.match(SOURCE, /<ArticleContent html=\{page\.content\}/);
    assert.doesNotMatch(SOURCE, /dangerouslySetInnerHTML/);
  });

  test("canonical and og:url are derived from the same ROUTES.page(slug) the metadata uses", () => {
    const bodyCanonical = SOURCE.match(
      /const canonicalUrl = getCanonicalUrl\(ROUTES\.page\(slug\)\);/,
    );
    const metadataCanonical = SOURCE.match(
      /getCanonicalUrl\(ROUTES\.page\(slug\)\), \{/,
    );
    assert.ok(bodyCanonical && metadataCanonical);
  });

  test("no preview flow was added — out of scope, matching the blog route's own precedent", () => {
    assert.doesNotMatch(SOURCE, /draftMode|isPreview|Preview/);
  });
});
