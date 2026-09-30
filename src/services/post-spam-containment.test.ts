import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe, mock } from "node:test";

import { wpPostFixture } from "../../test/fixtures/wp-content.ts";

// 2026-09 spam incident containment: ~3,000 posts injected straight into the
// WordPress DB carry `modified: null`, which the strict wpPostSchema rejects.
// Before this fix one such record failed the whole GetPosts parse → /blog
// 500. Now each post is validated on its own: invalid records are dropped
// (never rendered, listed, or put in the sitemap) and valid ones survive.
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";
process.env.WORDPRESS_USE_MOCK_DATA = "";

const posts = await import("./post.service.ts");
const { getAllSitemapEntries } = await import("../lib/seo/sitemap.ts");
const { wpPostSchema } = await import("../schemas/api/wp-post.schema.ts");
const { GET_POSTS, GET_POSTS_BY_CATEGORY, GET_POSTS_BY_TAG, GET_POSTS_SEARCH } =
  await import("../graphql/queries/post.queries.ts");
const { WordPressError } = await import("../lib/wordpress/errors.ts");

const SPAM_MARKER = "casino-payload-must-never-be-logged";
const realPost = wpPostFixture;
const spamPost = (n: number) => ({
  ...wpPostFixture,
  id: `spam-${n}`,
  databaseId: 215 + n,
  slug: `spam-${n}`,
  title: `${SPAM_MARKER} ${n}`,
  content: `<p>${SPAM_MARKER}</p>`,
  date: "2026-09-11T12:16:21",
  modified: null,
});

const pageInfo = {
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: "a",
  endCursor: "b",
};

// Every posts-connection query gets `nodes`; the single-post query gets
// `post`; anything else (services, taxonomies, pages...) fails, which the
// sitemap's per-source catches degrade to nothing.
function cmsServes({ nodes = [] as unknown[], post = null as unknown } = {}) {
  return mock.method(globalThis, "fetch", async (_url: unknown, init?: RequestInit) => {
    const body = String(init?.body ?? "");
    if (body.includes("GetPostBySlug")) return Response.json({ data: { post } });
    if (/GetPosts(ByCategory|ByTag|Search)?\b/.test(body)) {
      return Response.json({ data: { posts: { nodes, pageInfo } } });
    }
    throw new TypeError("fetch failed");
  });
}

const slugs = (page: { items: { slug: string }[] }) => page.items.map((p) => p.slug);

describe("post spam containment — per-record validation", () => {
  let warn: ReturnType<typeof mock.method>;

  beforeEach(() => {
    warn = mock.method(console, "warn", () => {});
    mock.method(console, "error", () => {});
  });
  afterEach(() => mock.restoreAll());

  test("modified:null stays schema-invalid; the real post stays valid", () => {
    assert.equal(wpPostSchema.safeParse(spamPost(1)).success, false);
    assert.equal(wpPostSchema.safeParse({ ...realPost, modified: undefined }).success, false);
    assert.equal(wpPostSchema.safeParse(realPost).success, true);
  });

  test("an all-valid collection renders normally, with no rejection log", async () => {
    cmsServes({ nodes: [realPost] });
    const result = await posts.getPostsStrict({ first: 9 });
    assert.deepEqual(slugs(result), ["seo-for-small-businesses"]);
    assert.equal(result.totalCount, 1);
    assert.equal(warn.mock.callCount(), 0);
  });

  test("valid + invalid: the valid post survives, the invalid one is rejected, no throw", async () => {
    cmsServes({ nodes: [spamPost(1), realPost] });
    assert.deepEqual(slugs(await posts.getPostsStrict({ first: 9 })), [
      "seo-for-small-businesses",
    ]);
  });

  test("3,000 invalid + 1 valid: only the valid post is returned; one aggregate log without content", async () => {
    const nodes = [...Array.from({ length: 3000 }, (_, i) => spamPost(i)), realPost];
    cmsServes({ nodes });

    const result = await posts.getPostsStrict({ first: 9 });
    assert.deepEqual(slugs(result), ["seo-for-small-businesses"]);

    assert.equal(warn.mock.callCount(), 1);
    const message = String(warn.mock.calls[0].arguments[0]);
    assert.match(message, /Rejected 3000 of 3001 invalid WordPress records/);
    assert.match(message, /modified: invalid_type/);
    assert.ok(!message.includes(SPAM_MARKER), "spam content must never be logged");
    assert.ok(message.length < 500, "log line stays small");
  });

  test("soft getPosts (sidebars, generateStaticParams) returns the valid post only", async () => {
    cmsServes({ nodes: [spamPost(1), spamPost(2), realPost] });
    assert.deepEqual(slugs(await posts.getPosts({ first: 100 })), [
      "seo-for-small-businesses",
    ]);
  });

  test("category, tag and search listings exclude rejected records", async () => {
    cmsServes({ nodes: [spamPost(1), realPost, spamPost(2)] });
    assert.deepEqual(slugs(await posts.getPostsByCategory("seo")), ["seo-for-small-businesses"]);
    assert.deepEqual(slugs(await posts.getPostsByTag("local")), ["seo-for-small-businesses"]);
    assert.deepEqual(slugs(await posts.getPostsBySearchStrict("seo")), [
      "seo-for-small-businesses",
    ]);
  });

  test("the sitemap lists the real post and never a rejected one", async () => {
    cmsServes({ nodes: [...Array.from({ length: 50 }, (_, i) => spamPost(i)), realPost] });
    const urls = (await getAllSitemapEntries()).map((e) => new URL(e.url).pathname);
    assert.ok(urls.includes("/blog/seo-for-small-businesses"));
    assert.equal(urls.filter((u) => u.startsWith("/blog/spam-")).length, 0);
  });

  test("a malformed single post resolves to null (→ notFound), never rendered", async () => {
    cmsServes({ post: spamPost(1) });
    assert.equal(await posts.getPostBySlug("spam-1"), null);
  });

  test("the legitimate /blog/seo-for-small-businesses post is unaffected", async () => {
    cmsServes({ post: realPost });
    const post = await posts.getPostBySlug("seo-for-small-businesses");
    assert.equal(post?.slug, "seo-for-small-businesses");
    assert.equal(post?.updatedAt, realPost.modified);
  });

  test("a CMS outage on a single post still throws (5xx), not a de-indexing 404", async () => {
    mock.method(globalThis, "fetch", async () => {
      throw new TypeError("fetch failed");
    });
    await assert.rejects(
      () => posts.getPostBySlug("seo-for-small-businesses-outage"),
      (error: unknown) => error instanceof WordPressError && error.kind === "network",
    );
  });

  test("a malformed envelope still fails loudly (per-record leniency is nodes-only)", async () => {
    mock.method(globalThis, "fetch", async () => Response.json({ data: { posts: { nodes: "x" } } }));
    await assert.rejects(
      () => posts.getPostsStrict(),
      (error: unknown) => error instanceof WordPressError && error.kind === "parse",
    );
  });
});

describe("TEMPORARY GET_POSTS ordering (revert after WordPress cleanup)", () => {
  test("GET_POSTS orders by MODIFIED DESC so null-modified spam sinks below real posts", () => {
    assert.match(GET_POSTS, /orderby:\s*\{\s*field:\s*MODIFIED,\s*order:\s*DESC\s*\}/);
  });

  test("category, tag and search queries keep their default ordering", () => {
    for (const query of [GET_POSTS_BY_CATEGORY, GET_POSTS_BY_TAG, GET_POSTS_SEARCH]) {
      assert.doesNotMatch(query, /orderby/);
    }
  });
});
