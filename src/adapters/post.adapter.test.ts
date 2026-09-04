import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { wpPostFixture } from "../../test/fixtures/wp-content.ts";
import { adaptPost } from "./post.adapter.ts";

// The WordPress → domain boundary for posts (audit DEP-2's "WordPress
// adapters" path). Pins the behaviours later remediations attached here:
// entity-decoded plain-text excerpts (CONTENT-1), sanitized body HTML
// (ARCH-5), and null-tolerant nested connections (PARTIAL-1).

describe("adaptPost", () => {
  test("strips and entity-decodes the excerpt into plain text", () => {
    assert.equal(adaptPost(wpPostFixture).excerpt, "Don’t guess & hope.");
  });

  test("sanitizes the body: scripts and handlers are gone, WP markup survives", () => {
    const { content } = adaptPost(wpPostFixture);
    // Only that sanitization is wired here — the policy itself is pinned in
    // src/lib/content/sanitize-wp-html.test.ts.
    assert.doesNotMatch(content, /<script|onerror/);
    assert.match(content, /<h2 class="wp-block-heading">Intro<\/h2>/);
    assert.match(content, /<img src="https:\/\/cms\.example\.test\/a\.png"/);
  });

  test("tolerates WPGraphQL nulls: no body, no excerpt, no image/author/taxonomies", () => {
    const post = adaptPost({
      ...wpPostFixture,
      excerpt: null,
      content: null,
      featuredImage: null,
      author: null,
      categories: null,
      tags: null,
    });
    assert.equal(post.excerpt, "");
    assert.equal(post.content, "");
    assert.equal(post.featuredImage, null);
    assert.equal(post.author, null);
    assert.deepEqual(post.categories, []);
    assert.deepEqual(post.tags, []);
  });

  test("maps nested nodes and falls back SEO to the title and decoded excerpt", () => {
    const post = adaptPost({
      ...wpPostFixture,
      author: {
        node: {
          id: "u1",
          name: "Yash",
          slug: "yash",
          avatar: null,
          description: null,
        },
      },
      categories: {
        nodes: [{ id: "c1", name: "SEO", slug: "seo", count: null }],
      },
      tags: { nodes: [{ id: "t1", name: "Local", slug: "local" }] },
    });
    assert.equal(post.author?.name, "Yash");
    assert.deepEqual(post.categories, [
      { id: "c1", name: "SEO", slug: "seo", count: 0 },
    ]);
    assert.deepEqual(post.tags, [{ id: "t1", name: "Local", slug: "local" }]);
    assert.equal(post.seo?.title, "SEO for Small Businesses");
    assert.equal(post.seo?.description, "Don’t guess & hope.");
    assert.deepEqual(post.seo?.robots, { index: true, follow: true });
  });
});
