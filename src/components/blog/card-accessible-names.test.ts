import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

import { accessibleName } from "../../../test/accessible-name.ts";

// CARDA11Y-1: every blog/case-study card is a single link wrapping the whole
// card, so without a label its accessible name is the concatenation of badge,
// title, excerpt, author, date and reading time. Screen-reader users get a
// paragraph where they need a headline. Each card link is named by its title
// instead — the same string the card already shows.

const read = (path: string) =>
  readFileSync(new URL(path, import.meta.url), "utf8");

const POST_CARD = read("./PostCard.tsx");
const FEATURED_POST = read("./FeaturedPost.tsx");
const BLOG_SIDEBAR = read("./BlogSidebar.tsx");
const CASE_STUDY_CARD = read("../../sections/case-studies/CaseStudyCard.tsx");
const SELECTED_WORK = read("../../sections/home/SelectedWork.tsx");

const TITLE =
  "SEO for Small Businesses: A Practical Guide to Getting Found on Google";

/**
 * The markup FeaturedPost emits. Sibling elements are written without
 * whitespace between them because that is exactly what React renders — the
 * run-together names below are the real ones, not an artefact of the fixture.
 * `withImage` is false by default: the live featured post has no WordPress
 * featured image, which is the DOM the 533-character name was measured on.
 */
function featuredCard({ labelled = true, withImage = false } = {}) {
  const image = withImage ? `<img alt="${TITLE}" src="/hero.png">` : "";
  const dom = new JSDOM(
    `<!doctype html><html><body>` +
      `<a href="/blog/seo-for-small-businesses"${labelled ? ` aria-label="${TITLE}"` : ""}>` +
      `<div>${image}</div>` +
      `<div>` +
      `<span>Featured</span>` +
      `<span>SEO</span>` +
      `<h2>${TITLE}</h2>` +
      `<p>Small businesses no longer need a huge marketing budget to compete online. With the right SEO strategy, a local business can appear in front of people who are actively searching for its products or services on Google.</p>` +
      `<div><span>admin</span><span aria-hidden="true">·</span>` +
      `<time datetime="2026-08-12T12:39:58">Aug 12, 2026</time>` +
      `<span aria-hidden="true">·</span><span>11 min read</span></div>` +
      `<span>Read article<svg aria-hidden="true"></svg></span>` +
      `</div></a></body></html>`,
  );
  const link = dom.window.document.querySelector("a") as Element;
  return { link, document: dom.window.document };
}

/** The markup BlogSidebar's recent-post row emits; same whitespace note. */
function sidebarRow({ labelled = true, withImage = false } = {}) {
  const thumb = withImage ? `<img alt="${TITLE}" src="/thumb.png">` : "";
  const dom = new JSDOM(
    `<!doctype html><html><body>` +
      `<a href="/blog/seo-for-small-businesses"${labelled ? ` aria-label="${TITLE}"` : ""}>` +
      `<span>${thumb}</span>` +
      `<span><span>${TITLE}</span>` +
      `<time datetime="2026-08-12T12:39:58">Aug 12, 2026</time></span>` +
      `</a></body></html>`,
  );
  const link = dom.window.document.querySelector("a") as Element;
  return { link, document: dom.window.document };
}

describe("featured blog card link name (CARDA11Y-1)", () => {
  test("is exactly the post title", () => {
    const { link, document } = featuredCard();
    assert.equal(accessibleName(link, document), TITLE);
  });

  test("without the label it degrades to the whole card read aloud", () => {
    // The pre-fix state measured on the live listing: badge, category, title,
    // excerpt, byline, date, reading time and the affordance, all run together.
    const { link, document } = featuredCard({ labelled: false });
    const name = accessibleName(link, document);
    assert.ok(
      name.length > 200,
      `expected a long concatenation, got ${name.length}`,
    );
    assert.match(name, /^Featured/);
    assert.match(name, /Read article$/);
    assert.match(name, /11 min read/);
  });

  test("the name is a prefix-free match for the visible heading (WCAG 2.5.3)", () => {
    const { link, document } = featuredCard();
    const heading = document.querySelector("h2")?.textContent?.trim();
    assert.equal(accessibleName(link, document), heading);
  });

  test("decorative marks stay out of the name", () => {
    const { link, document } = featuredCard({ labelled: false });
    assert.doesNotMatch(accessibleName(link, document), /·/);
  });

  test("a card with a featured image is still named by the title alone", () => {
    // Without the label the image's alt text would be prepended too, since
    // WordPress posts fall back to the title for missing alt text.
    const withImage = featuredCard({ withImage: true });
    assert.equal(accessibleName(withImage.link, withImage.document), TITLE);

    const unlabelled = featuredCard({ labelled: false, withImage: true });
    const name = accessibleName(unlabelled.link, unlabelled.document);
    assert.equal(
      name.startsWith(TITLE),
      true,
      "alt text leads the concatenation",
    );
    assert.ok(name.length > TITLE.length + 200);
  });
});

describe("sidebar recent-post row name (CARDA11Y-1)", () => {
  test("is the post title, not the title run into the date", () => {
    const { link, document } = sidebarRow();
    assert.equal(accessibleName(link, document), TITLE);
  });

  test("without the label the title collides with the date", () => {
    const { link, document } = sidebarRow({ labelled: false });
    assert.equal(accessibleName(link, document), `${TITLE}Aug 12, 2026`);
    assert.match(accessibleName(link, document), /GoogleAug 12, 2026/);
  });

  test("the label also absorbs the thumbnail's alt text when there is one", () => {
    const { link, document } = sidebarRow({ withImage: true });
    assert.equal(accessibleName(link, document), TITLE);
  });
});

describe("every whole-card link names itself by its title", () => {
  test("PostCard, FeaturedPost and the sidebar row label from post.title", () => {
    for (const [name, source] of [
      ["PostCard", POST_CARD],
      ["FeaturedPost", FEATURED_POST],
      ["BlogSidebar", BLOG_SIDEBAR],
    ] as const) {
      assert.match(
        source,
        /aria-label=\{post\.title\}/,
        `${name} labels its card link`,
      );
    }
  });

  test("CaseStudyCard labels from caseStudy.title", () => {
    assert.match(CASE_STUDY_CARD, /aria-label=\{caseStudy\.title\}/);
  });

  test("the homepage work card keeps its specific overlay label", () => {
    // That link has no content of its own (an absolutely positioned overlay),
    // so a label is mandatory there rather than a duplicate of visible text.
    assert.match(
      SELECTED_WORK,
      /aria-label=\{`View case study: \$\{clientLabel\}`\}/,
    );
  });

  test("no card uses a generic, destination-free label", () => {
    for (const source of [
      POST_CARD,
      FEATURED_POST,
      BLOG_SIDEBAR,
      CASE_STUDY_CARD,
      SELECTED_WORK,
    ]) {
      assert.doesNotMatch(
        source,
        /aria-label="(Read more|Read article|Learn more|Click here|View)"/i,
      );
    }
  });

  test("FeaturedPost no longer carries the now-unreachable sr-only title", () => {
    // aria-label on the link overrides its subtree, so a screen-reader-only
    // copy of the title inside it could never be announced.
    assert.doesNotMatch(
      FEATURED_POST,
      /<span className="sr-only"> \{post\.title\}<\/span>/,
    );
    assert.match(FEATURED_POST, /Read article/);
  });
});
