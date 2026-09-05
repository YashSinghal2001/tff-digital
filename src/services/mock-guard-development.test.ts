import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe, mock } from "node:test";

// ARCH-3, the permitted half: outside a production build (`next dev`, this
// test runner) the flag still serves src/lib/mock content, with no network
// request at all — local development without a CMS keeps working.
// Next types NODE_ENV as read-only; the test runner may set it freely.
(process.env as Record<string, string | undefined>).NODE_ENV = "development";
process.env.WORDPRESS_USE_MOCK_DATA = "true";
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";

const services = await import("./service-offering.service.ts");
const caseStudies = await import("./case-study.service.ts");
const posts = await import("./post.service.ts");

describe("mock data in a development process (ARCH-3)", () => {
  let fetchMock: ReturnType<typeof mock.method>;
  beforeEach(() => {
    fetchMock = mock.method(globalThis, "fetch", async () => {
      throw new Error("must not be called");
    });
  });
  afterEach(() => mock.restoreAll());

  test("listings come from src/lib/mock without touching the network", async () => {
    const offerings = await services.getServiceOfferings();
    const studies = await caseStudies.getCaseStudies();
    const blog = await posts.getPosts();
    assert.equal(offerings.items[0]?.title, "Brand Strategy");
    assert.equal(studies.items[0]?.title, "Acme Growth Story");
    assert.match(blog.items[0]?.title ?? "", /Headless WordPress/);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  test("by-slug lookups resolve from the mock set and unknown slugs stay null", async () => {
    const service = await services.getServiceOfferingBySlug("brand-strategy");
    assert.equal(service?.title, "Brand Strategy");
    assert.equal(
      await services.getServiceOfferingBySlug("does-not-exist"),
      null,
    );
    assert.equal(fetchMock.mock.callCount(), 0);
  });
});
