import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import {
  wpServiceOfferingQueryResultSchema,
  wpServiceOfferingsQueryResultSchema,
} from "./wp-service-offering.schema.ts";
import type {
  WPServiceOffering,
  WPServiceOfferingsQueryResult,
} from "@/types/api/wp-service-offering";

// Root-schema coverage for the service queries (audit CQ-1). The node
// shape itself is also exercised transitively by the case-study tests via
// relatedServices; these tests exist because `satisfies z.ZodType<...>`
// cannot catch a too-STRICT schema — only runtime acceptance tests can.

const validService: WPServiceOffering = {
  id: "c2VydmljZToy",
  slug: "ai-consulting",
  title: "AI Consulting",
  content: null,
  date: "2026-06-01T09:00:00",
  modified: "2026-06-02T09:00:00",
  featuredImage: null,
  serviceFields: {
    shortDescription: null,
    description: "Long form.",
    displayOrder: 3,
    features: null,
    icon: {
      node: {
        id: "m9",
        sourceUrl: "https://cms.example.com/wp-content/uploads/icon.svg",
        altText: "AI icon",
        mediaDetails: null,
      },
    },
  },
  seo: null,
};

describe("wpServiceOfferingsQueryResultSchema", () => {
  test("accepts a well-formed GetServices response deep-equal", () => {
    const valid: WPServiceOfferingsQueryResult = {
      services: {
        nodes: [validService],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null,
        },
      },
    };
    assert.deepEqual(wpServiceOfferingsQueryResultSchema.parse(valid), valid);
  });

  test("rejects a services connection returned without .nodes", () => {
    const result = wpServiceOfferingsQueryResultSchema.safeParse({
      services: {},
    });
    assert.equal(result.success, false);
  });
});

describe("wpServiceOfferingQueryResultSchema", () => {
  test("accepts null service (not-found path)", () => {
    assert.deepEqual(
      wpServiceOfferingQueryResultSchema.parse({ service: null }),
      { service: null },
    );
  });

  test("accepts the preview response's extra databaseId/status fields", () => {
    const preview = { ...validService, databaseId: 11, status: "draft" };
    const parsed = wpServiceOfferingQueryResultSchema.parse({
      service: preview,
    });
    assert.equal(parsed.service?.databaseId, 11);
    assert.equal(parsed.service?.status, "draft");
  });

  test("rejects a wrong primitive in the ACF group (displayOrder as string)", () => {
    const result = wpServiceOfferingQueryResultSchema.safeParse({
      service: {
        ...validService,
        serviceFields: { ...validService.serviceFields, displayOrder: "3" },
      },
    });
    assert.equal(result.success, false);
  });
});

describe("wpServiceOfferingSchema — features textarea (ARCH-1)", () => {
  test("accepts the ACF features textarea as a string", () => {
    const withFeatures = {
      ...validService,
      serviceFields: {
        ...validService.serviceFields!,
        features: "Technical SEO\r\nOn-Page SEO",
      },
    };
    assert.deepEqual(
      wpServiceOfferingQueryResultSchema.parse({ service: withFeatures }),
      { service: withFeatures },
    );
  });

  test("rejects a non-string features value", () => {
    const result = wpServiceOfferingQueryResultSchema.safeParse({
      service: {
        ...validService,
        serviceFields: { ...validService.serviceFields!, features: ["x"] },
      },
    });
    assert.equal(result.success, false);
  });
});
