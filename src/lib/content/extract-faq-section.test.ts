import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import { extractFaqSection } from "./extract-faq-section.ts";

// CONTENT-FAQ: a service's customHtmlContent can carry its own FAQ answers
// inside a <section data-content-section="faq"> block so editors don't need
// a second ACF field. extractFaqSection is the single place that both lifts
// those <details>/<summary> pairs into { question, answer } items AND strips
// the marker section out of the HTML the normal content renderer sees — one
// parse, so the two outputs can never drift or double-render the same FAQ.
// Runs on sanitizeWpHtml's output in production; these fixtures are already
// in that shape (no scripts/attrs the sanitizer would strip).

describe("extractFaqSection", () => {
  test("returns the html unchanged and no faqs when there is no marker section", () => {
    const html = "<section><h2>How the project moves</h2><p>Step one.</p></section>";
    assert.deepEqual(extractFaqSection(html), { html, faqs: [] });
  });

  test("extracts a single FAQ item and strips the marker section", () => {
    const html =
      "<section><h2>Intro</h2><p>Body.</p></section>" +
      '<section data-content-section="faq"><h2>Frequently asked questions</h2>' +
      "<details><summary>How much does a website cost?</summary>" +
      "<p>It depends on the work involved.</p></details></section>";

    const result = extractFaqSection(html);

    assert.equal(result.html, "<section><h2>Intro</h2><p>Body.</p></section>");
    assert.deepEqual(result.faqs, [
      { question: "How much does a website cost?", answer: "It depends on the work involved." },
    ]);
  });

  test("extracts multiple FAQ items in document order", () => {
    const html =
      '<section data-content-section="faq">' +
      "<details><summary>Q1?</summary><p>A1.</p></details>" +
      "<details><summary>Q2?</summary><p>A2.</p></details>" +
      "<details><summary>Q3?</summary><p>A3.</p></details>" +
      "</section>";

    assert.deepEqual(extractFaqSection(html).faqs, [
      { question: "Q1?", answer: "A1." },
      { question: "Q2?", answer: "A2." },
      { question: "Q3?", answer: "A3." },
    ]);
  });

  test("treats a present-but-empty FAQ section as zero FAQs, and still strips it", () => {
    const html =
      "<section><p>Keep me.</p></section>" +
      '<section data-content-section="faq"><h2>Frequently asked questions</h2></section>';

    assert.deepEqual(extractFaqSection(html), {
      html: "<section><p>Keep me.</p></section>",
      faqs: [],
    });
  });

  test("drops a <details> block missing a <summary> (no question)", () => {
    const html =
      '<section data-content-section="faq">' +
      "<details><p>Answer with no question.</p></details>" +
      "<details><summary>Q2?</summary><p>A2.</p></details>" +
      "</section>";

    assert.deepEqual(extractFaqSection(html).faqs, [{ question: "Q2?", answer: "A2." }]);
  });

  test("drops a <details> block whose summary is blank", () => {
    const html =
      '<section data-content-section="faq">' +
      "<details><summary>   </summary><p>Answer.</p></details>" +
      "</section>";

    assert.deepEqual(extractFaqSection(html).faqs, []);
  });

  test("drops a <details> block with a question but no answer content", () => {
    const html =
      '<section data-content-section="faq">' +
      "<details><summary>Q1?</summary></details>" +
      "</section>";

    assert.deepEqual(extractFaqSection(html).faqs, []);
  });

  test("ignores <details> elements outside the marked section", () => {
    const html =
      "<section><details><summary>Not a FAQ</summary><p>Ignored.</p></details></section>" +
      '<section data-content-section="faq">' +
      "<details><summary>Real FAQ?</summary><p>Real answer.</p></details>" +
      "</section>";

    const result = extractFaqSection(html);

    assert.deepEqual(result.faqs, [{ question: "Real FAQ?", answer: "Real answer." }]);
    // The unrelated <details> block, and its surrounding <section>, survive
    // untouched in the returned content.
    assert.match(result.html, /<summary>Not a FAQ<\/summary>/);
    assert.doesNotMatch(result.html, /data-content-section/);
  });

  test("strips only the marked section, leaving surrounding content intact", () => {
    const before = "<section><h2>Before</h2><p>Keep this.</p></section>";
    const after = "<section><h2>After</h2><p>And this.</p></section>";
    const faqSection =
      '<section data-content-section="faq"><details><summary>Q?</summary><p>A.</p></details></section>';

    const result = extractFaqSection(before + faqSection + after);

    assert.equal(result.html, before + after);
  });

  test("strips HTML tags out of the question and answer text", () => {
    // htmlToPlainText (reused as-is here) inserts a space wherever a tag
    // sat, even one directly touching punctuation — a documented, existing
    // quirk of that shared utility (see post-content.test.ts), not
    // something this parser adds. Fixture text here avoids that seam so
    // this test stays about extraction, not htmlToPlainText's spacing.
    const html =
      '<section data-content-section="faq">' +
      "<details><summary>What about <strong>pricing</strong> and scope</summary>" +
      "<p>It depends on <em>project</em> size and the <a href=\"/contact\">timeline</a></p></details>" +
      "</section>";

    assert.deepEqual(extractFaqSection(html).faqs, [
      {
        question: "What about pricing and scope",
        answer: "It depends on project size and the timeline",
      },
    ]);
  });

  test("only honors the first marked section when more than one is present", () => {
    const html =
      '<section data-content-section="faq">' +
      "<details><summary>First?</summary><p>Kept.</p></details>" +
      "</section>" +
      '<section data-content-section="faq">' +
      "<details><summary>Second?</summary><p>Untouched.</p></details>" +
      "</section>";

    const result = extractFaqSection(html);

    // Single source of truth: only the first marked section feeds faqs. The
    // second is left as ordinary (if unusual) content — not a second,
    // independently-parsed FAQ list.
    assert.deepEqual(result.faqs, [{ question: "First?", answer: "Kept." }]);
    assert.doesNotMatch(result.html, /First\?/);
    assert.match(result.html, /Second\?/);
  });
});
