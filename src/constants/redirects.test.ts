import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { ROUTES } from "./routes.ts";
import { SERVICE_REDIRECTS } from "./redirects.ts";

// The retired bespoke SEO page must hand its URL to the WordPress "AEO & SEO"
// service permanently (ARCH-1 residual), and nothing may redirect one of the
// six canonical service URLs away.
const CANONICAL_SERVICE_SLUGS = [
  "aeo-seo",
  "smm",
  "meta-ads",
  "web-development",
  "video-editing",
  "zoho-one",
  "zoho-crm",
];

describe("SERVICE_REDIRECTS", () => {
  test("/services/seo permanently redirects to /services/aeo-seo", () => {
    const seo = SERVICE_REDIRECTS.find((r) => r.source === "/services/seo");
    assert.ok(seo, "missing /services/seo redirect");
    assert.equal(seo.destination, ROUTES.service("aeo-seo"));
    assert.equal(seo.permanent, true);
  });

  test("never redirects a canonical service URL, and never self-loops", () => {
    const canonical = new Set(CANONICAL_SERVICE_SLUGS.map(ROUTES.service));
    for (const redirect of SERVICE_REDIRECTS) {
      assert.ok(
        !canonical.has(redirect.source),
        `${redirect.source} is a canonical service URL`,
      );
      assert.notEqual(redirect.source, redirect.destination);
    }
  });
});
