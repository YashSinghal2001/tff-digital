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
