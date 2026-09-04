import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import {
  getReadingTimeMinutes,
  htmlToPlainText,
  stripDuplicateFeaturedImage,
  stripHtml,
  withHeadingIds,
} from "./post-content.ts";

// CONTENT-1: stripHtml must decode WordPress's common HTML entities after
// stripping tags, so "plain text" consumers (excerpts, JSON-LD descriptions,
// metadata fallbacks) never surface literal strings like "[&hellip;]".
describe("stripHtml — entity decoding (CONTENT-1)", () => {
  test("decodes the live regression case: WP auto-excerpt terminator", () => {
    assert.equal(
      htmlToPlainText("<p>…an e-commerce store, or [&hellip;]</p>"),
      "…an e-commerce store, or […]",
    );
  });

  test("decodes the audit's named entity set", () => {
    assert.equal(stripHtml("a &amp; b").trim(), "a & b");
    assert.equal(stripHtml("&nbsp;x").trim(), "x");
    assert.equal(
      stripHtml("it&rsquo;s &ldquo;here&rdquo;").trim(),
      "it’s “here”",
    );
    assert.equal(
      stripHtml("2019&ndash;2026 &mdash; TFF&trade;").trim(),
      "2019–2026 — TFF™",
    );
  });

  test("decodes numeric entities, decimal and hex", () => {
    assert.equal(stripHtml("it&#8217;s").trim(), "it’s");
    assert.equal(stripHtml("it&#x27;s").trim(), "it's");
    assert.equal(stripHtml("&#x1F600;").trim(), "😀");
  });

  test("strips tags BEFORE decoding: author-escaped markup survives as text", () => {
    // If decoding ran first, &lt;b&gt; would become a real tag and be eaten.
    assert.equal(
      htmlToPlainText("<p>use &lt;b&gt; for bold</p>"),
      "use <b> for bold",
    );
  });

  test("unknown and malformed entities pass through verbatim, without throwing", () => {
    assert.equal(stripHtml("&notarealentity;").trim(), "&notarealentity;");
    assert.equal(stripHtml("fish & chips").trim(), "fish & chips");
    assert.equal(stripHtml("&#xZZ;").trim(), "&#xZZ;");
    // out-of-range, NUL, and lone-surrogate code points are left verbatim
    assert.equal(stripHtml("&#99999999;").trim(), "&#99999999;");
    assert.equal(stripHtml("&#0;").trim(), "&#0;");
    assert.equal(stripHtml("&#xD800;").trim(), "&#xD800;");
  });

  test("single scan: a decoded '&' never re-combines into a second decode", () => {
    // "&amp;lt;" is an author's literal "&lt;" — one call must yield "&lt;",
    // never "<". (Known, documented limit: a SECOND stripHtml pass over the
    // same value decodes it further; the pipeline's sinks all escape.)
    assert.equal(stripHtml("&amp;lt;script&amp;gt;").trim(), "&lt;script&gt;");
    assert.equal(stripHtml("&amp;amp;").trim(), "&amp;");
  });

  test("entity-free input is unchanged (additive-only guarantee)", () => {
    assert.equal(
      htmlToPlainText("<p>Plain excerpt with <strong>tags</strong> only.</p>"),
      "Plain excerpt with tags only.",
    );
  });
});

describe("getReadingTimeMinutes — stable on entity-free input", () => {
  test("word counting unchanged for plain content", () => {
    const words = Array.from({ length: 400 }, (_, i) => `word${i}`).join(" ");
    assert.equal(getReadingTimeMinutes(`<p>${words}</p>`), 2);
  });

  test("empty content stays 0", () => {
    assert.equal(getReadingTimeMinutes(""), 0);
  });

  test("behavior delta, pinned: &nbsp; now separates words instead of gluing them", () => {
    // Pre-CONTENT-1 this counted "a&nbsp;b" as one token; decoded it is two
    // words — a correctness improvement, documented here deliberately.
    assert.equal(getReadingTimeMinutes("<p>a&nbsp;b</p>"), 1);
    assert.equal(getReadingTimeMinutes("&nbsp;"), 0);
  });
});

// Guard against an over-broad fix: these helpers re-emit HTML and have their
// own inline tag handling — they must NOT start decoding entities, or heading
// anchor IDs and re-rendered HTML would change.
describe("HTML-emitting helpers untouched by entity decoding", () => {
  test("withHeadingIds leaves entity-bearing HTML byte-identical apart from ids", () => {
    const { html, headings } = withHeadingIds(
      "<h2>SEO &amp; SEM</h2><p>&hellip;</p>",
    );
    assert.equal(
      html,
      '<h2 id="seo-amp-sem">SEO &amp; SEM</h2><p>&hellip;</p>',
    );
    assert.equal(headings[0].id, "seo-amp-sem");
  });

  test("stripDuplicateFeaturedImage returns HTML with entities intact", () => {
    const body = "<p>intro &amp; more</p>";
    assert.equal(
      stripDuplicateFeaturedImage(body, "https://x.test/photo.jpg"),
      body,
    );
  });
});
