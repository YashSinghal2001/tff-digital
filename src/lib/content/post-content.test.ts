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
import { sanitizeWpHtml } from "./sanitize-wp-html.ts";

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
    // The anchor id is slugified from the undecoded text (byte-stable for
    // existing share links); only the ToC label is decoded.
    assert.equal(headings[0].id, "seo-amp-sem");
    assert.equal(headings[0].text, "SEO & SEM");
  });

  test("stripDuplicateFeaturedImage returns HTML with entities intact", () => {
    const body = "<p>intro &amp; more</p>";
    assert.equal(
      stripDuplicateFeaturedImage(body, "https://x.test/photo.jpg"),
      body,
    );
  });
});

// CONTENT-1, table of contents: HeadingEntry.text is rendered as a React
// text node, but it is cut from SANITIZED HTML, whose text is entity-escaped
// by sanitize-html (&, <, >, " become &amp; &lt; &gt; &quot;). Without
// decoding, a heading like "Q&A" showed up in the ToC as the literal string
// "Q&amp;A".
describe("withHeadingIds — ToC text is decoded plain text (CONTENT-1)", () => {
  test("decodes named and numeric entities in the heading label", () => {
    const { headings } = withHeadingIds(
      "<h2>Q&amp;A</h2><h3>Don&#8217;t &quot;guess&quot; &gt; hope</h3>",
    );
    assert.deepEqual(
      headings.map((heading) => heading.text),
      ["Q&A", 'Don’t "guess" > hope'],
    );
  });

  test("strips inline tags before decoding, so author-escaped markup stays text", () => {
    const { headings } = withHeadingIds(
      "<h2>Use <code>&lt;strong&gt;</code> for <em>bold</em></h2>",
    );
    assert.equal(headings[0].text, "Use <strong> for bold");
    assert.equal(headings[0].id, "use-lt-strong-gt-for-bold");
  });

  test("the real pipeline: WordPress body → sanitizeWpHtml → ToC", () => {
    // What WP emits for a heading typed as: Keyword & Search Intent — Don't
    const wpBody =
      '<h2 class="wp-block-heading">Keyword &amp; Search Intent &#8212; Don&#8217;t</h2>' +
      '<h2 onclick="alert(1)">Q&amp;A <script>alert(1)</script></h2>' +
      "<p>Body &amp; text.</p>";
    const { html, headings } = withHeadingIds(sanitizeWpHtml(wpBody));

    assert.deepEqual(
      headings.map(({ id, text }) => ({ id, text })),
      [
        {
          id: "keyword-amp-search-intent-don-t",
          text: "Keyword & Search Intent — Don’t",
        },
        { id: "q-amp-a", text: "Q&A" },
      ],
    );
    // The HTML keeps entities browser-decodable and the sanitizer's
    // guarantees intact: markup renders, script/handlers are gone, and
    // nothing has been double-escaped.
    assert.match(html, /Keyword &amp; Search Intent — Don’t<\/h2>/);
    assert.doesNotMatch(html, /onclick|<script|&amp;amp;/);
  });
});
