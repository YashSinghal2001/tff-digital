import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { ZodError, z } from "zod";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import { parseWordPressResponse } from "./parse-response.ts";
import { WordPressError, isWordPressError } from "./errors.ts";

// A tiny stand-in schema: these tests pin the helper's error contract
// (audit CQ-1), not any real WordPress shape — those live in
// src/schemas/api/*.schema.test.ts.
const schema = z.object({
  posts: z.object({ nodes: z.array(z.string()) }),
});

describe("parseWordPressResponse", () => {
  test("returns the parsed data for a valid response", () => {
    const data = { posts: { nodes: ["a", "b"] } };
    assert.deepEqual(parseWordPressResponse(schema, data, "GetPosts"), data);
  });

  test("throws WordPressError with kind 'parse' for an invalid response", () => {
    assert.throws(
      () => parseWordPressResponse(schema, { posts: {} }, "GetPosts"),
      (error: unknown) => {
        assert.equal(isWordPressError(error), true);
        assert.equal((error as WordPressError).kind, "parse");
        return true;
      },
    );
  });

  test("never lets a ZodError escape", () => {
    // A raw ZodError would be misread as a form-input failure by the
    // contact action's `instanceof ZodError` branch — the helper must
    // always convert.
    assert.throws(
      () => parseWordPressResponse(schema, null, "GetPosts"),
      (error: unknown) => {
        assert.equal(error instanceof ZodError, false);
        assert.equal(error instanceof WordPressError, true);
        return true;
      },
    );
  });

  test("names the query and the failing paths, but never response content", () => {
    const sentinel = "SECRET-CMS-CONTENT-42";
    assert.throws(
      () =>
        parseWordPressResponse(
          schema,
          { posts: { nodes: [sentinel, 7] } },
          "GetPostsByTag",
        ),
      (error: unknown) => {
        const message = (error as Error).message;
        assert.match(message, /GetPostsByTag/);
        assert.match(message, /posts\.nodes\.1/);
        assert.doesNotMatch(message, new RegExp(sentinel));
        return true;
      },
    );
  });

  test("reports the root path readably when the whole response is wrong", () => {
    assert.throws(
      () => parseWordPressResponse(schema, "not-an-object", "GetTags"),
      (error: unknown) => {
        assert.match((error as Error).message, /<root>: invalid_type/);
        return true;
      },
    );
  });
});
