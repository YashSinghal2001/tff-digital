import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// Client-provided Home schema: a single-item "Home" BreadcrumbList + one
// FAQPage question, layered on top of the layout's sitewide
// ProfessionalService/WebSite — never a leaked Service/OfferCatalog node,
// which stays scoped to the service detail route.

const HOME_PAGE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("/ (home) JSON-LD wiring (client schema)", () => {
  test("emits exactly one single-item Home breadcrumb via the shared builder", () => {
    assert.equal(HOME_PAGE.match(/buildBreadcrumbJsonLd\(\[/g)?.length, 1);
    assert.match(HOME_PAGE, /name:\s*"Home"/);
  });

  test("emits exactly one FAQPage sourced from faqs[0]", () => {
    assert.equal(HOME_PAGE.match(/buildFaqJsonLd\(\[faqs\[0\]\]\)/g)?.length, 1);
  });

  test("does not leak a Service/OfferCatalog/ItemList node onto the homepage", () => {
    assert.doesNotMatch(HOME_PAGE, /buildServiceJsonLd\(/);
    assert.doesNotMatch(HOME_PAGE, /buildServiceListJsonLd\(/);
  });

  test("does not introduce a second ProfessionalService/Organization builder call", () => {
    assert.doesNotMatch(HOME_PAGE, /buildOrganizationJsonLd/);
    assert.doesNotMatch(HOME_PAGE, /buildProfessionalServiceJsonLd/);
  });

  test("uses the shared JsonLd renderer, not a bespoke script tag", () => {
    assert.match(HOME_PAGE, /<JsonLd\s/);
  });
});
