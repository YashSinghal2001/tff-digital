import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// Client request: service card descriptions must show at most 4 visible
// lines. Scoped to the Services grid only via FeatureGrid's opt-in
// `clampDescription` prop, so the other FeatureGrid consumers (Industries,
// Values, WhySeniorLed, RelatedServices) are unaffected.

const SERVICES_GRID = readFileSync(
  new URL("./ServicesGrid.tsx", import.meta.url),
  "utf8",
);
const FEATURE_GRID = readFileSync(
  new URL("../../components/common/FeatureGrid.tsx", import.meta.url),
  "utf8",
);

describe("ServicesGrid description clamp", () => {
  test("opts into FeatureGrid's clampDescription prop", () => {
    assert.match(SERVICES_GRID, /<FeatureGrid[\s\S]*?clampDescription[\s\S]*?\/>/);
  });

  test("does not remove features or the Learn more link from the mapped items", () => {
    assert.match(SERVICES_GRID, /features: service\.features/);
    assert.match(SERVICES_GRID, /href: service\.href/);
  });
});

describe("FeatureGrid clampDescription prop", () => {
  test("defaults to off so other FeatureGrid consumers are unaffected", () => {
    assert.match(FEATURE_GRID, /clampDescription = false/);
  });

  test("applies line-clamp-4 to the description only when enabled", () => {
    assert.match(
      FEATURE_GRID,
      /clampDescription && "line-clamp-4"/,
    );
  });

  test("the feature list and link markup are untouched by the clamp", () => {
    const featuresBlock = FEATURE_GRID.slice(
      FEATURE_GRID.indexOf("item.features && item.features.length"),
      FEATURE_GRID.indexOf("{item.href ?"),
    );
    assert.doesNotMatch(featuresBlock, /line-clamp/);
  });
});
