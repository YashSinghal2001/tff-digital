import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import {
  wpPostQueryResultSchema,
  wpPostsQueryResultSchema,
} from "./wp-post.schema.ts";
import type { WPPost, WPPostsQueryResult } from "@/types/api/wp-post";
import type { WPMediaItem } from "@/types/api/wp-media";

// Inline fixtures mirroring the PostFields selection exactly (the richest
// response shape — connection + media + author + taxonomies + seo), typed
// against the interfaces so fixture and contract cannot drift (audit CQ-1).

const media: WPMediaItem = {
  id: "m1",
  sourceUrl: "https://cms.example.com/wp-content/uploads/hero.jpg",
  altText: null,
  mediaDetails: { width: 800, height: 600 },
};

const validPost: WPPost = {
  id: "cG9zdDox",
  databaseId: 42,
  slug: "seo-for-small-businesses",
  title: "SEO for Small Businesses",
  excerpt: "<p>An excerpt.</p>",
  content: "<p>The body.</p>",
  date: "2026-08-01T10:00:00",
  modified: "2026-08-02T11:30:00",
  featuredImage: { node: media },
  author: {
    node: {
      id: "dXNlcjox",
      name: "admin",
      slug: "admin",
      avatar: { url: "https://secure.gravatar.com/avatar/abc" },
      description: null,
    },
  },
  categories: { nodes: [{ id: "c1", name: "SEO", slug: "seo", count: 1 }] },
  tags: { nodes: [] },
  seo: {
    title: "SEO for Small Businesses",
    metaDesc: null,
    canonical: null,
    opengraphTitle: null,
    opengraphDescription: null,
    opengraphImage: media,
    twitterTitle: null,
    twitterDescription: null,
    twitterImage: null,
    metaRobotsNoindex: null,
    metaRobotsNofollow: null,
    schema: { raw: null },
  },
};

const pageInfo = {
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: null,
  endCursor: null,
};

const validResult: WPPostsQueryResult = {
  posts: { nodes: [validPost], pageInfo },
};

describe("wpPostsQueryResultSchema", () => {
  test("accepts a well-formed WPGraphQL posts response and returns it deep-equal", () => {
    assert.deepEqual(wpPostsQueryResultSchema.parse(validResult), validResult);
  });

  test("accepts the null-heavy shape WPGraphQL sends for a bare post", () => {
    // WPGraphQL really does return null for excerpt/content/etc. on posts
    // with no body — the valid-behavior-unchanged guard for minimal content.
    const bare: WPPostsQueryResult = {
      posts: {
        nodes: [
          {
            ...validPost,
            excerpt: null,
            content: null,
            featuredImage: null,
            author: null,
            categories: null,
            tags: null,
            seo: null,
          },
        ],
        pageInfo,
      },
    };
    assert.deepEqual(wpPostsQueryResultSchema.parse(bare), bare);
  });

  test("rejects a response missing the posts field entirely", () => {
    const result = wpPostsQueryResultSchema.safeParse({});
    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0]?.path, ["posts"]);
  });

  test("rejects a required field gone missing (slug absent)", () => {
    // Missing, not null: a selected field absent from the response is a
    // protocol violation, which is why the schema says nullable, never
    // optional, for content fields.
    const clone = structuredClone(validResult);
    delete (clone.posts.nodes[0] as Partial<WPPost>).slug;
    const result = wpPostsQueryResultSchema.safeParse(clone);
    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0]?.path, [
      "posts",
      "nodes",
      0,
      "slug",
    ]);
  });

  test("rejects a wrong primitive type (databaseId as string)", () => {
    const result = wpPostsQueryResultSchema.safeParse({
      posts: { nodes: [{ ...validPost, databaseId: "42" }], pageInfo },
    });
    assert.equal(result.success, false);
    assert.equal(result.error?.issues[0]?.code, "invalid_type");
    assert.equal(result.error?.issues[0]?.path.at(-1), "databaseId");
  });

  test("rejects featuredImage as a string instead of { node }", () => {
    const result = wpPostsQueryResultSchema.safeParse({
      posts: {
        nodes: [{ ...validPost, featuredImage: "https://x.example/a.jpg" }],
        pageInfo,
      },
    });
    assert.equal(result.success, false);
    assert.equal(result.error?.issues[0]?.path.at(-1), "featuredImage");
  });

  test("rejects a connection returned without .nodes (the PARTIAL-1 shape)", () => {
    const atRoot = wpPostsQueryResultSchema.safeParse({ posts: { pageInfo } });
    assert.equal(atRoot.success, false);
    assert.deepEqual(atRoot.error?.issues[0]?.path, ["posts", "nodes"]);

    const nested = wpPostsQueryResultSchema.safeParse({
      posts: { nodes: [{ ...validPost, categories: {} }], pageInfo },
    });
    assert.equal(nested.success, false);
    assert.deepEqual(nested.error?.issues[0]?.path, [
      "posts",
      "nodes",
      0,
      "categories",
      "nodes",
    ]);
  });

  test("rejects nodes that is not an array", () => {
    for (const nodes of ["not-an-array", { 0: validPost }]) {
      const result = wpPostsQueryResultSchema.safeParse({
        posts: { nodes, pageInfo },
      });
      assert.equal(result.success, false);
      assert.equal(result.error?.issues[0]?.code, "invalid_type");
    }
  });

  test("strips unknown extra fields instead of failing or passing them through", () => {
    // Zod v4 z.object default. Deliberate: an additive WPGraphQL/plugin
    // change must not become an outage (strict), and stray fields must not
    // flow into the app (loose/passthrough).
    const withExtras = {
      posts: {
        nodes: [{ ...validPost, yoastHead: "<meta>" }],
        pageInfo,
        extraField: true,
      },
    };
    const parsed = wpPostsQueryResultSchema.parse(withExtras);
    assert.deepEqual(parsed, validResult);
  });
});

describe("wpPostQueryResultSchema", () => {
  test("accepts null post for a single-post query (not-found path)", () => {
    assert.deepEqual(wpPostQueryResultSchema.parse({ post: null }), {
      post: null,
    });
  });

  test("accepts a single well-formed post", () => {
    assert.deepEqual(wpPostQueryResultSchema.parse({ post: validPost }), {
      post: validPost,
    });
  });
});
