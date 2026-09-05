import assert from "node:assert/strict";
import test, { describe, mock } from "node:test";

// CLIENT-1: getPageBySlug/getPages in mock mode, untouched by
// outage-resilience.test.ts (which only exercises the live-WordPress
// path). Separate file: config modules read process.env at import, so a
// mock-mode scenario needs its own process (see wordpress.config.test.ts's
// own convention note).
process.env.WORDPRESS_USE_MOCK_DATA = "true";
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";

const fetchMock = mock.method(globalThis, "fetch", async () => {
  throw new Error("must not be called in mock mode");
});
const { getPageBySlug, getPages } = await import("./content-page.service.ts");

describe("content-page.service — mock mode", () => {
  test("getPageBySlug returns a mock page by slug, and null for an unknown one", async () => {
    assert.equal((await getPageBySlug("about"))?.title, "About");
    assert.equal(await getPageBySlug("does-not-exist"), null);
  });

  test("getPages returns the mock page list, never touching the network", async () => {
    const result = await getPages();
    assert.ok(result.items.length > 0);
    assert.equal(fetchMock.mock.callCount(), 0);
  });
});
