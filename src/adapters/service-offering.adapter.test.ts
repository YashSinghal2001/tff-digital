import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { wpServiceOfferingFixture } from "../../test/fixtures/wp-content.ts";
import {
  adaptServiceOffering,
  parseServiceFaqs,
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

describe("parseServiceFaqs", () => {
  test("trims each row's question and answer", () => {
    assert.deepEqual(
      parseServiceFaqs([{ question: "  Q1?  ", answer: "  A1.  " }]),
      [{ question: "Q1?", answer: "A1." }],
    );
  });

  test("drops rows missing a question or an answer", () => {
    assert.deepEqual(
      parseServiceFaqs([
        { question: "Q1?", answer: "A1." },
        { question: null, answer: "A2." },
        { question: "Q3?", answer: null },
        { question: "  ", answer: "A4." },
        { question: "Q5?", answer: "  " },
      ]),
      [{ question: "Q1?", answer: "A1." }],
    );
  });

  test("yields an empty list for null or undefined input", () => {
    assert.deepEqual(parseServiceFaqs(null), []);
    assert.deepEqual(parseServiceFaqs(undefined), []);
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
    assert.deepEqual(service.faqs, []);
  });

  test("maps the faqs repeater", () => {
    const service = adaptServiceOffering({
      ...wpServiceOfferingFixture,
      serviceFields: {
        ...wpServiceOfferingFixture.serviceFields!,
        faqs: [{ question: "How long?", answer: "6-12 months." }],
      },
    });
    assert.deepEqual(service.faqs, [
      { question: "How long?", answer: "6-12 months." },
    ]);
  });

  test("keeps entities browser-decodable on both rich-text sources (CONTENT-1)", () => {
    const entities =
      "<p>Facebook &amp; Instagram Ads don&#8217;t &quot;guess&quot;</p>";
    const expected = '<p>Facebook &amp; Instagram Ads don’t "guess"</p>';
    const fromContent = adaptServiceOffering({
      ...wpServiceOfferingFixture,
      content: entities,
    });
    const fromAcf = adaptServiceOffering({
      ...wpServiceOfferingFixture,
      content: null,
      serviceFields: {
        ...wpServiceOfferingFixture.serviceFields!,
        description: entities,
      },
    });
    assert.equal(fromContent.content, expected);
    assert.equal(fromAcf.content, expected);
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

  test("normalizes a missing/null customHtmlContent to an empty string", () => {
    assert.equal(adaptServiceOffering(wpServiceOfferingFixture).customHtmlContent, "");
    const noFieldGroup = adaptServiceOffering({
      ...wpServiceOfferingFixture,
      serviceFields: null,
    });
    assert.equal(noFieldGroup.customHtmlContent, "");
  });

  test("maps customHtmlContent, preserving legitimate markup exactly (section, table, details)", () => {
    const html =
      '<section class="promo"><h2>Plan</h2><p>Keep <strong>this</strong>.</p>' +
      "<details><summary>FAQ</summary><p>Answer</p></details>" +
      "<table><tr><td>cell</td></tr></table></section>";
    const service = adaptServiceOffering({
      ...wpServiceOfferingFixture,
      serviceFields: {
        ...wpServiceOfferingFixture.serviceFields!,
        customHtmlContent: html,
      },
    });
    assert.equal(service.customHtmlContent, html);
  });

  test("sanitizes customHtmlContent — it is CMS content, not developer-trusted markup (ARCH-5)", () => {
    const hostile =
      '<section><script>alert(1)</script><img src="x" onerror="alert(1)">' +
      '<a href="javascript:alert(1)">x</a></section>';
    const service = adaptServiceOffering({
      ...wpServiceOfferingFixture,
      serviceFields: {
        ...wpServiceOfferingFixture.serviceFields!,
        customHtmlContent: hostile,
      },
    });
    assert.doesNotMatch(
      service.customHtmlContent,
      /<script|onerror|javascript:/,
    );
  });

  describe("CONTENT-FAQ: FAQ section embedded in customHtmlContent", () => {
    test("lifts a data-content-section=\"faq\" block into customHtmlFaqs and strips it from customHtmlContent", () => {
      const html =
        "<section><h2>How the project moves</h2><p>Step one.</p></section>" +
        '<section data-content-section="faq"><h2>Frequently asked questions</h2>' +
        "<details><summary>How much does a website cost?</summary>" +
        "<p>It depends on the work involved.</p></details></section>";
      const service = adaptServiceOffering({
        ...wpServiceOfferingFixture,
        serviceFields: {
          ...wpServiceOfferingFixture.serviceFields!,
          customHtmlContent: html,
        },
      });

      assert.deepEqual(service.customHtmlFaqs, [
        {
          question: "How much does a website cost?",
          answer: "It depends on the work involved.",
        },
      ]);
      // No duplicate rendering: the marked section — and any trace of the
      // marker attribute — is gone from what ArticleContent will render.
      assert.equal(
        service.customHtmlContent,
        "<section><h2>How the project moves</h2><p>Step one.</p></section>",
      );
      assert.doesNotMatch(service.customHtmlContent, /data-content-section/);
      assert.doesNotMatch(service.customHtmlContent, /Frequently asked questions/);
    });

    test("yields an empty customHtmlFaqs list when there is no marked section", () => {
      const html = "<section><h2>Plan</h2><p>Body.</p></section>";
      const service = adaptServiceOffering({
        ...wpServiceOfferingFixture,
        serviceFields: {
          ...wpServiceOfferingFixture.serviceFields!,
          customHtmlContent: html,
        },
      });
      assert.deepEqual(service.customHtmlFaqs, []);
      assert.equal(service.customHtmlContent, html);
    });

    test("yields an empty customHtmlFaqs list, and still strips the section, when it has no valid items", () => {
      const html =
        "<section><p>Keep me.</p></section>" +
        '<section data-content-section="faq"><h2>Frequently asked questions</h2></section>';
      const service = adaptServiceOffering({
        ...wpServiceOfferingFixture,
        serviceFields: {
          ...wpServiceOfferingFixture.serviceFields!,
          customHtmlContent: html,
        },
      });
      assert.deepEqual(service.customHtmlFaqs, []);
      assert.equal(service.customHtmlContent, "<section><p>Keep me.</p></section>");
    });

    test("does not treat an unmarked <details> elsewhere on the page as a FAQ", () => {
      // Same fixture the "preserving legitimate markup exactly" test above
      // uses — an ordinary <details> with no data-content-section marker
      // must keep rendering as content, not get harvested into customHtmlFaqs.
      const html =
        '<section class="promo"><h2>Plan</h2><p>Keep <strong>this</strong>.</p>' +
        "<details><summary>FAQ</summary><p>Answer</p></details>" +
        "<table><tr><td>cell</td></tr></table></section>";
      const service = adaptServiceOffering({
        ...wpServiceOfferingFixture,
        serviceFields: {
          ...wpServiceOfferingFixture.serviceFields!,
          customHtmlContent: html,
        },
      });
      assert.equal(service.customHtmlContent, html);
      assert.deepEqual(service.customHtmlFaqs, []);
    });

    test("extraction runs on already-sanitized content — a scripted FAQ block can't smuggle markup into customHtmlFaqs", () => {
      const hostile =
        '<section data-content-section="faq">' +
        '<details><summary>Q<script>alert(1)</script>?</summary>' +
        '<p>A<img src="x" onerror="alert(1)">.</p></details></section>';
      const service = adaptServiceOffering({
        ...wpServiceOfferingFixture,
        serviceFields: {
          ...wpServiceOfferingFixture.serviceFields!,
          customHtmlContent: hostile,
        },
      });
      // <script> and onerror never survive sanitizeWpHtml, which runs before
      // extraction — the plain-text result carries no trace of either.
      assert.deepEqual(service.customHtmlFaqs, [{ question: "Q?", answer: "A ." }]);
      assert.doesNotMatch(JSON.stringify(service.customHtmlFaqs), /script|onerror|alert/);
    });
  });
});
