import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { findBlogFaqSection, withFaqAccordion } from "./blog-faq.ts";
import { withHeadingIds } from "./post-content.ts";
import { sanitizeWpHtml } from "./sanitize-wp-html.ts";

// Verbatim shape of the live FAQ on /blog/seo-for-small-businesses as
// WPGraphQL returns it (Gutenberg heading/paragraph blocks, blank-line
// separated), trimmed to two questions plus one with inline markup.
const BEFORE =
  '<h2 class="wp-block-heading">A Simple 90-Day SEO Plan</h2>\n\n\n\n' +
  '<p class="wp-block-paragraph">Plan intro.</p>\n\n\n\n';
const FAQ_TITLE =
  '<h2 class="wp-block-heading">Frequently Asked Questions</h2>\n\n\n\n';
const Q1 =
  '<h3 class="wp-block-heading">How long does SEO take for a small business?</h3>\n\n\n\n';
const A1 =
  '<p class="wp-block-paragraph">Most small businesses begin seeing early improvements within three to six months.</p>\n\n\n\n';
const Q2 =
  '<h3 class="wp-block-heading">Is SEO worth it for a small business?</h3>\n\n\n\n';
const A2 =
  '<p class="wp-block-paragraph">Yes, SEO can be <strong>highly valuable</strong> &amp; see <a href="https://www.tffdigital.com/">TFF Digital</a>.</p>\n\n\n\n' +
  '<ul class="wp-block-list">\n<li>Traffic</li>\n<li>Trust</li>\n</ul>\n\n\n\n';
const AFTER =
  '<h2 class="wp-block-heading">Ready to Improve Your Google Visibility?</h2>\n\n\n\n' +
  '<p class="wp-block-paragraph">Contact us to discuss an SEO strategy.</p>\n';
const POST = BEFORE + FAQ_TITLE + Q1 + A1 + Q2 + A2 + AFTER;

// Exactly what the page does: sanitize (adapter), add heading ids, then transform.
function render(html: string) {
  const { html: headed, headings } = withHeadingIds(sanitizeWpHtml(html));
  return { headed, headings, out: withFaqAccordion(headed) };
}

const BUTTON =
  /<button type="button"[^>]*aria-expanded="([^"]*)"[^>]*aria-controls="([^"]*)"[^>]*>/g;

describe("findBlogFaqSection — detection", () => {
  test("detects the live article's FAQ and extracts every question", () => {
    const { headed } = render(POST);
    const section = findBlogFaqSection(headed);
    assert.ok(section);
    assert.equal(section.level, 2);
    assert.deepEqual(
      section.items.map((item) => [item.id, item.question]),
      [
        [
          "how-long-does-seo-take-for-a-small-business",
          "How long does SEO take for a small business?",
        ],
        [
          "is-seo-worth-it-for-a-small-business",
          "Is SEO worth it for a small business?",
        ],
      ],
    );
  });

  test("answers are preserved verbatim, inline markup and entities included", () => {
    const section = findBlogFaqSection(render(POST).headed);
    assert.equal(section?.items[0].answer, A1.trim());
    assert.equal(section?.items[1].answer, A2.trim());
  });

  test("accepts FAQ / FAQs titles and a trailing colon, any heading level", () => {
    for (const title of [
      "FAQ",
      "FAQs",
      "Frequently asked questions:",
      "FAQ:",
    ]) {
      const section = findBlogFaqSection(
        `<h3>${title}</h3><h4>Why?</h4><p>Because.</p><h3>Next</h3><p>x</p>`,
      );
      assert.ok(section, title);
      assert.equal(section.level, 3);
      assert.deepEqual(
        section.items.map((item) => [item.id, item.question, item.answer]),
        [["blog-faq-1", "Why?", "<p>Because.</p>"]],
      );
    }
  });

  test("ignores unrelated headings, including a list item that merely mentions FAQs", () => {
    assert.equal(
      findBlogFaqSection(
        "<ul><li>Frequently asked questions</li></ul><h2>Why FAQ pages rank</h2><h3>Because</h3><p>x</p>",
      ),
      null,
    );
    assert.equal(findBlogFaqSection(BEFORE + AFTER), null);
  });

  test("falls back safely on a FAQ heading with no questions, or a blank answer", () => {
    assert.equal(
      findBlogFaqSection("<h2>FAQ</h2><p>Coming soon.</p><h2>Next</h2>"),
      null,
    );
    assert.equal(
      findBlogFaqSection("<h2>FAQ</h2><h3>Q?</h3><h3>Q2?</h3><p>A2</p>"),
      null,
    );
    assert.equal(
      findBlogFaqSection("<h2>FAQ</h2><h3>Q?</h3><p>A</p><h3></h3><p>B</p>"),
      null,
    );
    assert.equal(findBlogFaqSection(""), null);
  });
});

describe("withFaqAccordion — output", () => {
  test("leaves posts without a FAQ byte-identical", () => {
    const { headed, out } = render(BEFORE + AFTER);
    assert.equal(out, headed);
    assert.equal(withFaqAccordion(""), "");
  });

  test("keeps content before and after the FAQ unchanged and the title heading in place", () => {
    const { headed, out } = render(POST);
    const titleEnd =
      headed.indexOf("</h2>", headed.indexOf("Frequently Asked")) +
      "</h2>".length;
    assert.ok(out.startsWith(headed.slice(0, titleEnd)));
    const after = headed.slice(
      headed.indexOf('<h2 class="wp-block-heading" id="ready'),
    );
    assert.ok(out.endsWith(after));
    assert.equal(out.match(/Frequently Asked Questions/g)?.length, 1);
    // The post-FAQ section is outside the accordion.
    assert.ok(
      out.indexOf("</div></div></div>") < out.indexOf("ready-to-improve"),
    );
  });

  test("renders every question as a real button with APG accordion wiring", () => {
    const { out } = render(POST);
    const buttons = [...out.matchAll(BUTTON)];
    assert.equal(buttons.length, 2);
    for (const [, expanded, controls] of buttons) {
      assert.equal(expanded, "false");
      assert.ok(
        out.includes(
          `<div id="${controls}" role="region" aria-labelledby="${controls.replace(/-panel$/, "")}"`,
        ),
      );
    }
    assert.ok(
      out.includes(
        '<h3 class="wp-block-heading" id="is-seo-worth-it-for-a-small-business" data-faq-question><button',
      ),
    );
    assert.equal(
      (out.match(/\bhidden>/g) ?? []).length,
      2,
      "every panel ships collapsed",
    );
    assert.equal(out.match(/<div[^>]*data-faq-item>/g)?.length, 2);
  });

  test("answer HTML — links, emphasis, entities, lists — survives inside the panel", () => {
    const { out } = render(POST);
    const panel = out.slice(
      out.indexOf('id="is-seo-worth-it-for-a-small-business-panel"'),
    );
    assert.ok(panel.includes(A2.trim()));
    assert.ok(
      panel.includes('<a href="https://www.tffdigital.com/">TFF Digital</a>'),
    );
    assert.ok(panel.includes("&amp;"));
  });

  test("the table-of-contents entries are untouched and their anchors still exist", () => {
    const { headings, out } = render(POST);
    assert.deepEqual(
      headings.map((heading) => heading.text),
      [
        "A Simple 90-Day SEO Plan",
        "Frequently Asked Questions",
        "How long does SEO take for a small business?",
        "Is SEO worth it for a small business?",
        "Ready to Improve Your Google Visibility?",
      ],
    );
    for (const heading of headings)
      assert.ok(out.includes(`id="${heading.id}"`), heading.id);
  });

  test("is deterministic across calls (SSR and hydration agree)", () => {
    const { headed } = render(POST);
    assert.equal(withFaqAccordion(headed), withFaqAccordion(headed));
  });
});
