import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import { wpPageQueryResultSchema } from "./wp-page.schema.ts";
import type { WPPage, WPPageQueryResult } from "@/types/api/wp-page";

// Inline fixture mirroring the GetPageBySlug selection, typed against the
// interface so fixture and contract cannot drift (audit CQ-1).

const validPage: WPPage = {
  id: "cGFnZTox",
  slug: "about",
  title: "About",
  content: "<p>About us.</p>",
  featuredImage: {
    node: {
      id: "m1",
      sourceUrl: "https://cms.example.com/wp-content/uploads/about.jpg",
      altText: "Team",
      mediaDetails: { width: 1200, height: 800 },
    },
  },
  seo: {
    title: "About - TFF Digital",
    metaDesc: null,
    canonical: null,
    opengraphTitle: null,
    opengraphDescription: null,
    opengraphImage: null,
    twitterTitle: null,
    twitterDescription: null,
    twitterImage: null,
    metaRobotsNoindex: null,
    metaRobotsNofollow: null,
    schema: null,
  },
};

const validResult: WPPageQueryResult = { page: validPage };

describe("wpPageQueryResultSchema", () => {
  test("accepts a well-formed page response and returns it deep-equal", () => {
    assert.deepEqual(wpPageQueryResultSchema.parse(validResult), validResult);
  });

  test("accepts the nullable fields as null (no image, no Yoast data)", () => {
    const bare: WPPageQueryResult = {
      page: { ...validPage, featuredImage: null, seo: null },
    };
    assert.deepEqual(wpPageQueryResultSchema.parse(bare), bare);
  });

  test("accepts null page for an unknown slug (not-found path)", () => {
    assert.deepEqual(wpPageQueryResultSchema.parse({ page: null }), {
      page: null,
    });
  });

  test("rejects a response missing the page field entirely", () => {
    const result = wpPageQueryResultSchema.safeParse({});
    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0]?.path, ["page"]);
  });

  test("rejects a required field gone missing (title absent)", () => {
    const clone = structuredClone(validResult);
    delete (clone.page as Partial<WPPage>).title;
    const result = wpPageQueryResultSchema.safeParse(clone);
    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0]?.path, ["page", "title"]);
  });

  test("rejects content as null: WPPage declares it non-null and the schema mirrors that", () => {
    const result = wpPageQueryResultSchema.safeParse({
      page: { ...validPage, content: null },
    });
    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0]?.path, ["page", "content"]);
  });

  test("rejects featuredImage as a string instead of { node }", () => {
    const result = wpPageQueryResultSchema.safeParse({
      page: { ...validPage, featuredImage: "https://x.example/a.jpg" },
    });
    assert.equal(result.success, false);
    assert.equal(result.error?.issues[0]?.path.at(-1), "featuredImage");
  });

  test("strips unknown extra fields instead of failing or passing them through", () => {
    const parsed = wpPageQueryResultSchema.parse({
      page: { ...validPage, yoastHead: "<meta>" },
      extraField: true,
    });
    assert.deepEqual(parsed, validResult);
  });
});
