import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// Service structured data: each service detail page must add a Service node
// alongside its existing BreadcrumbList, generically through the [slug]
// route — not as six hardcoded per-page blocks — and must not introduce a
// second ProfessionalService/Organization or BreadcrumbList builder call.
// FAQPage was added later, sourced from the same faqs[0] the visible
// accordion opens with — not a second, hardcoded copy of the question.

const SERVICE_DETAIL_PAGE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("service detail page JSON-LD wiring", () => {
  test("renders exactly one Service node via the shared builder", () => {
    assert.equal(SERVICE_DETAIL_PAGE.match(/buildServiceJsonLd\(/g)?.length, 1);
  });

  test("still renders exactly one BreadcrumbList via the shared builder", () => {
    assert.equal(SERVICE_DETAIL_PAGE.match(/buildBreadcrumbJsonLd\(\[/g)?.length, 1);
  });

  test("renders exactly one FAQPage sourced from FAQ.tsx's faqs[0]", () => {
    assert.equal(SERVICE_DETAIL_PAGE.match(/buildFaqJsonLd\(\[faqs\[0\]\]\)/g)?.length, 1);
  });

  test("does not introduce a second ProfessionalService/Organization builder call", () => {
    assert.doesNotMatch(SERVICE_DETAIL_PAGE, /buildOrganizationJsonLd/);
    assert.doesNotMatch(SERVICE_DETAIL_PAGE, /buildProfessionalServiceJsonLd/);
  });

  test("uses the shared JsonLd renderer, not a bespoke script tag", () => {
    assert.match(SERVICE_DETAIL_PAGE, /<JsonLd\s/);
  });
});
