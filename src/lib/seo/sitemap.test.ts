import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe, mock } from "node:test";

import { wpServiceOfferingFixture } from "../../../test/fixtures/wp-content.ts";

// The sitemap derives its service <loc>s from WordPress (ARCH-1): exactly the
// published services, one URL each, no static /services/seo or /services/smm
// entries competing with them, and never the same location twice.
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";
process.env.WORDPRESS_USE_MOCK_DATA = "";

const { getAllSitemapEntries } = await import("./sitemap.ts");

const CANONICAL_SERVICE_PATHS = [
  "/services/aeo-seo",
  "/services/smm",
  "/services/meta-ads",
  "/services/web-development",
  "/services/video-editing",
  "/services/zoho-one",
];

function serviceNode(slug: string, displayOrder: number) {
  return {
    ...wpServiceOfferingFixture,
    id: `service-${slug}`,
    slug,
    title: slug,
    serviceFields: { ...wpServiceOfferingFixture.serviceFields!, displayOrder },
  };
}

// Only the services query gets a healthy reply; every other WordPress source
// fails and is expected to degrade to nothing (each has its own catch).
function cmsServesOnlyServices(nodes: unknown[]) {
  return mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init?: RequestInit) => {
      const body = String(init?.body ?? "");
      if (!body.includes("GetServices")) throw new TypeError("fetch failed");
      return Response.json({
        data: {
          services: {
            nodes,
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: "a",
              endCursor: "b",
            },
          },
        },
      });
    },
  );
}

const pathOf = (url: string) => new URL(url).pathname;

describe("getAllSitemapEntries — WordPress services", () => {
  beforeEach(() => {
    mock.method(console, "error", () => {});
  });
  afterEach(() => mock.restoreAll());

  test("emits exactly the six canonical service URLs and no bespoke statics", async () => {
    cmsServesOnlyServices([
      serviceNode("zoho-one", 6),
      serviceNode("video-editing", 5),
      serviceNode("web-development", 4),
      serviceNode("meta-ads", 3),
      serviceNode("smm", 2),
      serviceNode("aeo-seo", 1),
    ]);

    const entries = await getAllSitemapEntries();
    const servicePaths = entries
      .map((entry) => pathOf(entry.url))
      .filter((path) => path.startsWith("/services/"));

    assert.deepEqual(servicePaths, CANONICAL_SERVICE_PATHS);
    assert.ok(!servicePaths.includes("/services/seo"));
    const listing = entries.find((entry) => pathOf(entry.url) === "/services");
    assert.ok(listing, "/services listing page stays in the sitemap");
    const aeo = entries.find(
      (entry) => pathOf(entry.url) === "/services/aeo-seo",
    );
    assert.equal(aeo?.lastModified, wpServiceOfferingFixture.modified);
  });

  test("never lists the same location twice", async () => {
    cmsServesOnlyServices([serviceNode("smm", 2), serviceNode("smm", 2)]);

    const entries = await getAllSitemapEntries();
    const urls = entries.map((entry) => entry.url);
    assert.equal(new Set(urls).size, urls.length);
    assert.equal(
      urls.filter((url) => pathOf(url) === "/services/smm").length,
      1,
    );
  });

  test("omits services (only) when the services query fails", async () => {
    mock.method(globalThis, "fetch", async () => {
      throw new TypeError("fetch failed");
    });

    const entries = await getAllSitemapEntries();
    assert.deepEqual(
      entries
        .map((entry) => pathOf(entry.url))
        .filter((p) => p.startsWith("/services/")),
      [],
    );
    assert.ok(entries.some((entry) => pathOf(entry.url) === "/services"));
  });
});
