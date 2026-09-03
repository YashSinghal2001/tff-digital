import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import {
  wpCategoriesQueryResultSchema,
  wpTagsQueryResultSchema,
} from "./wp-taxonomy.schema.ts";
import type {
  WPCategoriesQueryResult,
  WPTagsQueryResult,
} from "@/types/api/wp-taxonomy";

// Root-schema coverage for GetCategories/GetTags (audit CQ-1) — see the
// note in wp-service-offering.schema.test.ts for why acceptance tests are
// needed even with the `satisfies` pins.

const pageInfo = {
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: null,
  endCursor: null,
};

describe("wpCategoriesQueryResultSchema", () => {
  test("accepts a well-formed GetCategories response deep-equal", () => {
    const valid: WPCategoriesQueryResult = {
      categories: {
        nodes: [{ id: "c1", name: "SEO", slug: "seo", count: 1 }],
        pageInfo,
      },
    };
    assert.deepEqual(wpCategoriesQueryResultSchema.parse(valid), valid);
  });

  test("rejects a wrong primitive (count as string)", () => {
    const result = wpCategoriesQueryResultSchema.safeParse({
      categories: {
        nodes: [{ id: "c1", name: "SEO", slug: "seo", count: "1" }],
        pageInfo,
      },
    });
    assert.equal(result.success, false);
  });
});

describe("wpTagsQueryResultSchema", () => {
  test("accepts a well-formed GetTags response (empty list) deep-equal", () => {
    // Zero real tags exist on this install (audit ROUTE-2) — the empty
    // connection is the live shape, so it is the canonical fixture.
    const valid: WPTagsQueryResult = { tags: { nodes: [], pageInfo } };
    assert.deepEqual(wpTagsQueryResultSchema.parse(valid), valid);
  });

  test("rejects a tags connection returned without .nodes", () => {
    const result = wpTagsQueryResultSchema.safeParse({ tags: { pageInfo } });
    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0]?.path, ["tags", "nodes"]);
  });
});
