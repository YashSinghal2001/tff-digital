import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import { firstSearchParam } from "./search-params.ts";

describe("firstSearchParam", () => {
  test("passes a plain string through unchanged", () => {
    assert.equal(firstSearchParam("seo"), "seo");
  });

  test("returns undefined for a missing key", () => {
    assert.equal(firstSearchParam(undefined), undefined);
  });

  test("takes the first value of a repeated key", () => {
    // The exact SMOKE-2 shapes: `?q=a&q=b` and `?after=x&after=y`.
    assert.equal(firstSearchParam(["a", "b"]), "a");
    assert.equal(firstSearchParam(["x", "y"]), "x");
  });

  test("returns undefined for an empty array rather than undefined-as-string", () => {
    assert.equal(firstSearchParam([]), undefined);
  });

  test("preserves an empty string, so callers keep their own falsy handling", () => {
    // blog/page.tsx relies on `|| undefined` downstream; normalizing "" to
    // undefined here would silently move that decision into this helper.
    assert.equal(firstSearchParam(""), "");
  });

  test("result is safe to call string methods on after a falsy check", () => {
    // The original crash was `.trim()` on an array. Guard the whole chain.
    assert.equal(firstSearchParam(["  spaced  ", "b"])?.trim(), "spaced");
    assert.equal(firstSearchParam(undefined)?.trim(), undefined);
  });
});
