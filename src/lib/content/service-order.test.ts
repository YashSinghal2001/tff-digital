import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import { sortByDisplayOrder } from "./service-order.ts";

describe("sortByDisplayOrder", () => {
  test("orders by display_order ascending regardless of input order", () => {
    const sorted = sortByDisplayOrder([
      { order: 6, title: "ZOHO One" },
      { order: 1, title: "AEO & SEO" },
      { order: 3, title: "Meta Ads" },
      { order: 2, title: "SMM" },
    ]);
    assert.deepEqual(
      sorted.map((s) => s.title),
      ["AEO & SEO", "SMM", "Meta Ads", "ZOHO One"],
    );
  });

  test("places unordered services after ordered ones, then by title", () => {
    const sorted = sortByDisplayOrder([
      { order: null, title: "Zeta" },
      { order: 2, title: "Second" },
      { order: null, title: "Alpha" },
      { order: 2, title: "Also second" },
    ]);
    assert.deepEqual(
      sorted.map((s) => s.title),
      ["Also second", "Second", "Alpha", "Zeta"],
    );
  });

  test("does not mutate its input", () => {
    const input = [
      { order: 2, title: "B" },
      { order: 1, title: "A" },
    ];
    sortByDisplayOrder(input);
    assert.deepEqual(
      input.map((s) => s.order),
      [2, 1],
    );
  });
});
