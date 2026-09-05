import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import { wpCaseStudyQueryResultSchema } from "./wp-case-study.schema.ts";
import type { WPCaseStudy, WPCaseStudyFields } from "@/types/api/wp-case-study";
import type { WPServiceOffering } from "@/types/api/wp-service-offering";

// Compact companion to wp-post.schema.test.ts (the exemplar) — covers only
// what is unique to case studies: the ACF field group, the relatedServices
// inline fragment, and the preview-only extra fields (audit CQ-1).

const relatedService: WPServiceOffering = {
  id: "c2VydmljZTox",
  slug: "search-engine-optimization",
  title: "Search Engine Optimization",
  content: null,
  date: "2026-07-01T09:00:00",
  modified: "2026-07-02T09:00:00",
  featuredImage: null,
  serviceFields: {
    shortDescription: "Rank higher.",
    description: null,
    displayOrder: 1,
    features: null,
    icon: null,
  },
  seo: null,
};

const validFields: WPCaseStudyFields = {
  clientName: "ChicaBebo",
  industry: "Ecommerce",
  projectUrl: "https://chicabebo.nl",
  shortSummary: "Summary.",
  challenge: "Challenge.",
  solution: "Solution.",
  result1Label: "Traffic",
  result1Value: "+120%",
  result2Label: null,
  result2Value: null,
  result3Label: null,
  result3Value: null,
  result4Label: null,
  result4Value: null,
  featuredOnHomepage: true,
  relatedServices: { nodes: [relatedService] },
};

const validCaseStudy: WPCaseStudy = {
  id: "Y2FzZTox",
  slug: "stabilizing-and-scaling-seo",
  title: "Stabilizing and Scaling SEO",
  excerpt: null,
  content: "<p>Full write-up.</p>",
  date: "2026-08-10T08:00:00",
  modified: "2026-08-11T08:00:00",
  featuredImage: null,
  caseStudyFields: validFields,
  seo: null,
};

describe("wpCaseStudyQueryResultSchema", () => {
  test("accepts a well-formed public response (no preview fields)", () => {
    const parsed = wpCaseStudyQueryResultSchema.parse({
      caseStudy: validCaseStudy,
    });
    assert.deepEqual(parsed, { caseStudy: validCaseStudy });
    assert.equal("databaseId" in (parsed.caseStudy ?? {}), false);
  });

  test("accepts the preview response's extra databaseId/status fields", () => {
    const preview = { ...validCaseStudy, databaseId: 7, status: "draft" };
    const parsed = wpCaseStudyQueryResultSchema.parse({ caseStudy: preview });
    assert.equal(parsed.caseStudy?.databaseId, 7);
    assert.equal(parsed.caseStudy?.status, "draft");
  });

  test("accepts null caseStudy (not-found path) and null field group", () => {
    assert.deepEqual(wpCaseStudyQueryResultSchema.parse({ caseStudy: null }), {
      caseStudy: null,
    });
    const bare = { ...validCaseStudy, caseStudyFields: null };
    assert.deepEqual(wpCaseStudyQueryResultSchema.parse({ caseStudy: bare }), {
      caseStudy: bare,
    });
  });

  test("rejects a non-Service node in relatedServices (inline-fragment gap)", () => {
    // `... on Service` makes WPGraphQL return {} for a node of any other
    // type — previously that flowed through as id-less garbage; now it is
    // a typed boundary error. Untyped literal on purpose: safeParse takes
    // unknown, so malformed fixtures need no casts.
    const result = wpCaseStudyQueryResultSchema.safeParse({
      caseStudy: {
        ...validCaseStudy,
        caseStudyFields: { ...validFields, relatedServices: { nodes: [{}] } },
      },
    });
    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0]?.path.slice(0, 4), [
      "caseStudy",
      "caseStudyFields",
      "relatedServices",
      "nodes",
    ]);
  });

  test("rejects relatedServices returned without .nodes (the PARTIAL-1 shape)", () => {
    const result = wpCaseStudyQueryResultSchema.safeParse({
      caseStudy: {
        ...validCaseStudy,
        caseStudyFields: { ...validFields, relatedServices: {} },
      },
    });
    assert.equal(result.success, false);
  });
});
