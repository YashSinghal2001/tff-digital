import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// Client requests, both scoped to the Services grid only (via FeatureGrid's
// opt-in `clampDescription`/`hideFeatures` props), so the other FeatureGrid
// consumers (Industries, Values, WhySeniorLed, RelatedServices) and the
// service detail page (which doesn't use FeatureGrid at all) are unaffected:
//   1. service card descriptions must show at most 4 visible lines.
//   2. the feature/checkmark list must not render on the listing card —
//      full details remain on the service detail page instead.

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

describe("ServicesGrid feature list hidden on the listing card", () => {
  test("opts into FeatureGrid's hideFeatures prop", () => {
    assert.match(SERVICES_GRID, /<FeatureGrid[\s\S]*?hideFeatures[\s\S]*?\/>/);
  });

  test("still maps all six services and their detail hrefs, only the rendered checklist is hidden", () => {
    assert.match(SERVICES_GRID, /services\.map\(\(service\) => \(/);
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
});

describe("FeatureGrid hideFeatures prop", () => {
  test("defaults to off so other FeatureGrid consumers (e.g. detail-page related services) are unaffected", () => {
    assert.match(FEATURE_GRID, /hideFeatures = false/);
  });

  test("suppresses the feature/checkmark list block entirely rather than leaving an empty container", () => {
    assert.match(
      FEATURE_GRID,
      /!hideFeatures && item\.features && item\.features\.length > 0/,
    );
  });

  test("the Learn more link markup is untouched by hideFeatures", () => {
    const afterFeatures = FEATURE_GRID.slice(
      FEATURE_GRID.indexOf("!hideFeatures && item.features"),
    );
    assert.match(afterFeatures, /item\.href \?/);
    assert.match(afterFeatures, /linkLabel \?\? "Learn more"/);
  });
});
