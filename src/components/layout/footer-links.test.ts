import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { FOOTER_SERVICE_LINKS } from "./footer-links.ts";

// The footer mirrors the seven WordPress services by CMS title and slug
// (ARCH-1, CLIENT-6); it must never link a retired bespoke route.
const CANONICAL_SERVICES = [
  ["AEO & SEO", "/services/aeo-seo"],
  ["SMM", "/services/smm"],
  ["Meta Ads", "/services/meta-ads"],
  ["Web Development", "/services/web-development"],
  ["Video Editing", "/services/video-editing"],
  ["ZOHO One", "/services/zoho-one"],
  ["ZOHO CRM", "/services/zoho-crm"],
];

describe("FOOTER_SERVICE_LINKS", () => {
  test("lists exactly the seven canonical services, in display order", () => {
    assert.deepEqual(
      FOOTER_SERVICE_LINKS.map((link) => [link.label, link.href]),
      CANONICAL_SERVICES,
    );
  });

  test("has no duplicate targets and no retired /services/seo link", () => {
    const hrefs = FOOTER_SERVICE_LINKS.map((link) => link.href);
    assert.equal(new Set(hrefs).size, hrefs.length);
    assert.ok(!hrefs.includes("/services/seo"));
  });
});
