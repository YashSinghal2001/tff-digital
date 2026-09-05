import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { wpPageFixture } from "../../test/fixtures/wp-content.ts";
import { adaptContentPage } from "./content-page.adapter.ts";

// The WordPress → domain boundary for generic Pages (CLIENT-1): rich text
// must reach ArticleContent only after sanitization (ARCH-5), and a null
// content field — WordPress's actual response shape for an empty-body
// Page, confirmed live — must not crash the adapter or the sanitizer.

describe("adaptContentPage", () => {
  test("maps id, slug, title and sanitizes the body", () => {
    const page = adaptContentPage({
      ...wpPageFixture,
      content: '<p onclick="alert(1)">About us.</p><script>alert(1)</script>',
    });
    assert.equal(page.id, wpPageFixture.id);
    assert.equal(page.slug, wpPageFixture.slug);
    assert.equal(page.title, wpPageFixture.title);
    assert.doesNotMatch(page.content, /<script|onclick/);
    assert.match(page.content, /<p>About us\.<\/p>/);
  });

  test("a null content field (empty-body Page) normalizes to an empty string, not a crash", () => {
    const page = adaptContentPage({ ...wpPageFixture, content: null });
    assert.equal(page.content, "");
  });

  test("tolerates a missing featured image and no Yoast SEO data", () => {
    const page = adaptContentPage({
      ...wpPageFixture,
      featuredImage: null,
      seo: null,
    });
    assert.equal(page.featuredImage, null);
    assert.equal(page.seo?.title, wpPageFixture.title);
  });
});
