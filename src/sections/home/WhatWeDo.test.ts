import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// Client request, mirroring the /services grid treatment (see
// ../services/ServicesGrid.test.ts): the homepage "What We Do" cards are a
// bespoke implementation (not a FeatureGrid consumer), so the same two
// behaviors are applied directly to its own markup instead of via a prop:
//   1. service card descriptions must show at most 4 visible lines.
//   2. the feature/checkmark list must not render on the listing card —
//      full details remain on the service detail page instead.

const WHAT_WE_DO = readFileSync(
  new URL("./WhatWeDo.tsx", import.meta.url),
  "utf8",
);

describe("WhatWeDo description clamp", () => {
  test("clamps the summary paragraph to 4 visible lines", () => {
    assert.match(WHAT_WE_DO, /text-muted line-clamp-4 text-sm/);
  });
});

describe("WhatWeDo feature list hidden on the listing card", () => {
  test("does not render a feature/checkmark list", () => {
    assert.doesNotMatch(WHAT_WE_DO, /service\.features\.map/);
    assert.doesNotMatch(WHAT_WE_DO, /<Check\b/);
  });

  test("still maps all services and renders Learn more linking to the detail href", () => {
    assert.match(WHAT_WE_DO, /services\.map\(\(service\) => \{/);
    assert.match(WHAT_WE_DO, /href=\{service\.href\}/);
    assert.match(WHAT_WE_DO, />\s*Learn more/);
  });
});
