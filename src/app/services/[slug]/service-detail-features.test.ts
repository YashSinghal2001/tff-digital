import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// CONTENT-2: fe4ee9c and 78754b3 hid the feature/checkmark checklist on the
// homepage and /services listing cards, on the stated understanding that
// "the full feature list stays intact on the service detail page" — but
// this page never rendered `service.features` at all, so every one of the
// 6 live WordPress services' feature lists (e.g. AEO & SEO's "Technical
// SEO", "On-Page SEO", ...) became unreachable anywhere on the public site.

const DETAIL_PAGE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("service detail page renders the feature checklist (CONTENT-2)", () => {
  test("maps service.features into a checklist", () => {
    assert.match(DETAIL_PAGE, /service\.features\.length > 0/);
    assert.match(DETAIL_PAGE, /service\.features\.map\(\(feature\) => \(/);
  });

  test("uses a Check icon per item, matching FeatureGrid's checklist styling", () => {
    assert.match(DETAIL_PAGE, /<Check\b/);
    assert.match(DETAIL_PAGE, /import \{ Check \} from "lucide-react";/);
  });
});
