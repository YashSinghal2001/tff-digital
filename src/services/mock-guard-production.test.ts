import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe, mock } from "node:test";

import { wpServiceOfferingFixture } from "../../test/fixtures/wp-content.ts";

// ARCH-3, production half: with the mock flag pasted into a production
// environment, the services must still go to WordPress — a WordPress
// failure degrades to empty (soft) or a typed error (strict), never to
// src/lib/mock content, and real WordPress replies adapt exactly as before.
// Next types NODE_ENV as read-only; the test runner may set it freely.
(process.env as Record<string, string | undefined>).NODE_ENV = "production";
process.env.WORDPRESS_USE_MOCK_DATA = "true";
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";

mock.method(console, "error", () => {});
const services = await import("./service-offering.service.ts");
const caseStudies = await import("./case-study.service.ts");
const posts = await import("./post.service.ts");
const { WordPressError } = await import("../lib/wordpress/errors.ts");
mock.restoreAll();

const MOCK_MARKERS = /Brand Strategy|Acme Growth Story|Headless WordPress/;

describe("mock data in a production process (ARCH-3)", () => {
  let fetchMock: ReturnType<typeof mock.method>;
  beforeEach(() => {
    mock.method(console, "error", () => {});
  });
  afterEach(() => mock.restoreAll());

  test("a WordPress outage degrades soft listings to empty — never to mock content", async () => {
    fetchMock = mock.method(globalThis, "fetch", async () => {
      throw new TypeError("fetch failed");
    });
    const [offerings, studies, blog] = await Promise.all([
      services.getServiceOfferings(),
      caseStudies.getCaseStudies(),
      posts.getPosts(),
    ]);
    assert.deepEqual(offerings.items, []);
    assert.deepEqual(studies.items, []);
    assert.deepEqual(blog.items, []);
    assert.doesNotMatch(
      JSON.stringify([offerings, studies, blog]),
      MOCK_MARKERS,
    );
    assert.equal(fetchMock.mock.callCount(), 3);
  });

  test("a WordPress outage on a strict getter is a typed error — never a mock entry", async () => {
    mock.method(globalThis, "fetch", async () => {
      throw new TypeError("fetch failed");
    });
    await assert.rejects(
      services.getServiceOfferingBySlug("brand-strategy"),
      (error: unknown) =>
        error instanceof WordPressError && error.kind === "network",
    );
    await assert.rejects(
      caseStudies.getCaseStudyBySlug("acme-growth-story"),
      (error: unknown) => error instanceof WordPressError,
    );
  });

  test("a healthy WordPress reply still flows through the boundary and adapter unchanged", async () => {
    fetchMock = mock.method(globalThis, "fetch", async () =>
      Response.json({ data: { service: wpServiceOfferingFixture } }),
    );
    const service = await services.getServiceOfferingBySlug(
      "search-engine-optimization",
    );
    assert.equal(service?.slug, "search-engine-optimization");
    assert.equal(service?.title, "Search Engine Optimization");
    assert.deepEqual(service?.features, [
      "Technical SEO",
      "On-Page SEO",
      "Local SEO",
    ]);
    assert.equal(fetchMock.mock.callCount(), 1);
  });
});
