import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// JSONLD-1: /blog and /case-studies (the sibling top-level listing pages,
// each with their own detail sub-route) both emit a "Home > X" BreadcrumbList
// via buildBreadcrumbJsonLd — /services, the same architectural pattern
// (Home > Services > [service]), was the one hub page missing it.

const SERVICES_PAGE = readFileSync(
  new URL("./page.tsx", import.meta.url),
  "utf8",
);

describe("/services BreadcrumbList (JSONLD-1)", () => {
  test("emits a Home > Services breadcrumb via the shared builder", () => {
    assert.match(SERVICES_PAGE, /buildBreadcrumbJsonLd\(\[/);
    assert.match(SERVICES_PAGE, /name:\s*"Home"/);
    assert.match(SERVICES_PAGE, /name:\s*"Services"/);
  });

  test("uses the shared JsonLd renderer, not a bespoke script tag", () => {
    assert.match(SERVICES_PAGE, /<JsonLd\s/);
  });
});

// Client-provided Services schema: an ItemList of bare Service summaries +
// one FAQPage question — never the full per-service Service/OfferCatalog
// node, which stays scoped to the detail route.
describe("/services ItemList + FAQPage (client schema)", () => {
  test("emits exactly one ItemList via the shared builder", () => {
    assert.equal(SERVICES_PAGE.match(/buildServiceListJsonLd\(/g)?.length, 1);
  });

  test("emits exactly one FAQPage sourced from servicesFaqs[0]", () => {
    assert.equal(SERVICES_PAGE.match(/buildFaqJsonLd\(\[servicesFaqs\[0\]\]\)/g)?.length, 1);
  });

  test("does not leak a full per-service Service/OfferCatalog node onto the listing", () => {
    assert.doesNotMatch(SERVICES_PAGE, /buildServiceJsonLd\(/);
  });
});
