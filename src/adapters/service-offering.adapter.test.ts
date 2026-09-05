import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { wpServiceOfferingFixture } from "../../test/fixtures/wp-content.ts";
import {
  adaptServiceOffering,
  parseServiceFeatures,
} from "./service-offering.adapter.ts";

// The WordPress → domain boundary for services: the ACF `features` textarea
// becomes the bullet list the homepage and /services cards render (ARCH-1),
// and the rich-text body reaches ArticleContent only after sanitization
// (ARCH-5) — on both of its sources, the post body and the ACF description.

describe("parseServiceFeatures", () => {
  test("splits CRLF and LF lines, trims, and drops empty lines", () => {
    assert.deepEqual(
      parseServiceFeatures(
        "Technical SEO\r\n  On-Page SEO \r\n\r\nLocal SEO\n",
      ),
      ["Technical SEO", "On-Page SEO", "Local SEO"],
    );
  });

  test("yields an empty list for null, undefined, or blank input", () => {
    assert.deepEqual(parseServiceFeatures(null), []);
    assert.deepEqual(parseServiceFeatures(undefined), []);
    assert.deepEqual(parseServiceFeatures("  \r\n \n"), []);
  });
});

describe("adaptServiceOffering", () => {
  test("maps the ACF field group, including features and display order", () => {
    const service = adaptServiceOffering(wpServiceOfferingFixture);
    assert.equal(service.slug, "search-engine-optimization");
    assert.equal(service.summary, "Rank higher.");
    assert.equal(service.order, 1);
    assert.deepEqual(service.features, [
      "Technical SEO",
      "On-Page SEO",
      "Local SEO",
    ]);
  });

  test("tolerates a missing field group", () => {
    const service = adaptServiceOffering({
      ...wpServiceOfferingFixture,
      serviceFields: null,
    });
    assert.deepEqual(service.features, []);
    assert.equal(service.order, null);
    assert.equal(service.summary, "");
  });

  test("sanitizes the rich-text body on both sources: post content and the ACF description fallback (ARCH-5)", () => {
    const hostile =
      '<h2 onmouseover="alert(1)">Plan</h2><p>Keep <strong>this</strong>.</p>' +
      '<script>alert(1)</script><a href="javascript:alert(1)">x</a>' +
      '<div><p><img src="x" onerror="alert(1)"><iframe src="https://evil.example/">' +
      "</iframe></p></div><p>unclosed <em>tag";
    const fromContent = adaptServiceOffering({
      ...wpServiceOfferingFixture,
      content: hostile,
    });
    // Wiring only — the policy itself is pinned in sanitize-wp-html.test.ts.
    assert.doesNotMatch(
      fromContent.content,
      /<script|onmouseover|onerror|javascript:|evil\.example/,
    );
    assert.match(
      fromContent.content,
      /<h2>Plan<\/h2><p>Keep <strong>this<\/strong>\.<\/p>/,
    );
    assert.match(fromContent.content, /<p>unclosed <em>tag<\/em><\/p>$/);

    const fromDescription = adaptServiceOffering({
      ...wpServiceOfferingFixture,
      content: null,
      serviceFields: {
        ...wpServiceOfferingFixture.serviceFields!,
        description: hostile,
      },
    });
    assert.doesNotMatch(
      fromDescription.content,
      /<script|onmouseover|onerror|javascript:|evil\.example/,
    );
    assert.match(fromDescription.content, /<h2>Plan<\/h2>/);

    const empty = adaptServiceOffering({
      ...wpServiceOfferingFixture,
      content: null,
      serviceFields: {
        ...wpServiceOfferingFixture.serviceFields!,
        description: null,
      },
    });
    assert.equal(empty.content, "");
  });
});
