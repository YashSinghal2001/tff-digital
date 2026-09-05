import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe, mock } from "node:test";

import {
  wpCaseStudyFixture,
  wpCategoryFixture,
  wpPostFixture,
  wpServiceOfferingFixture,
  wpTagFixture,
} from "../../../test/fixtures/wp-content.ts";

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

// Blog category/tag archives (SITEMAP-1): the sitemap lists exactly the
// public, non-empty terms WordPress reports, one usable archive URL each,
// built from the same site URL as every other entry.
const PAGE_INFO = {
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: null,
  endCursor: null,
};

type CmsReplies = Partial<Record<string, unknown>>;

// Serves one reply per GraphQL operation name; operations without a reply
// fail like an outage and are expected to degrade to nothing.
function cmsServes(replies: CmsReplies) {
  return mock.method(
    globalThis,
    "fetch",
    async (_url: unknown, init?: RequestInit) => {
      const body = String(init?.body ?? "");
      const operation = Object.keys(replies).find((name) =>
        body.includes(`query ${name}`),
      );
      if (!operation) throw new TypeError("fetch failed");
      return Response.json({ data: replies[operation] });
    },
  );
}

const categoriesReply = (nodes: unknown[]) => ({
  categories: { nodes, pageInfo: PAGE_INFO },
});
const tagsReply = (nodes: unknown[]) => ({
  tags: { nodes, pageInfo: PAGE_INFO },
});

const taxonomyPaths = (entries: { url: string }[]) =>
  entries
    .map((entry) => pathOf(entry.url))
    .filter(
      (path) =>
        path.startsWith("/blog/category/") || path.startsWith("/blog/tag/"),
    );

describe("getAllSitemapEntries — blog categories and tags", () => {
  beforeEach(() => {
    mock.method(console, "error", () => {});
  });
  afterEach(() => mock.restoreAll());

  test("lists one archive URL per public category, on the site origin", async () => {
    cmsServes({
      GetCategories: categoriesReply([
        wpCategoryFixture,
        {
          ...wpCategoryFixture,
          id: "dGVybToz",
          name: "Ads",
          slug: "ads",
          count: 3,
        },
      ]),
      GetTags: tagsReply([]),
    });

    const entries = await getAllSitemapEntries();
    const categoryEntries = entries.filter((entry) =>
      pathOf(entry.url).startsWith("/blog/category/"),
    );
    assert.deepEqual(
      categoryEntries.map((entry) => entry.url),
      [
        "https://www.tffdigital.com/blog/category/seo",
        "https://www.tffdigital.com/blog/category/ads",
      ],
    );
    assert.ok(
      categoryEntries.every((entry) => entry.lastModified === undefined),
    );
  });

  test("lists one archive URL per public tag", async () => {
    cmsServes({
      GetCategories: categoriesReply([]),
      GetTags: tagsReply([
        wpTagFixture,
        {
          ...wpTagFixture,
          id: "dGVybTo0",
          name: "Analytics",
          slug: "analytics",
        },
      ]),
    });

    assert.deepEqual(taxonomyPaths(await getAllSitemapEntries()), [
      "/blog/tag/local-seo",
      "/blog/tag/analytics",
    ]);
  });

  test("emits no taxonomy URLs when WordPress reports no terms", async () => {
    cmsServes({ GetCategories: categoriesReply([]), GetTags: tagsReply([]) });

    const entries = await getAllSitemapEntries();
    assert.deepEqual(taxonomyPaths(entries), []);
    assert.ok(entries.some((entry) => pathOf(entry.url) === "/blog"));
  });

  test("never lists the same archive twice", async () => {
    cmsServes({
      GetCategories: categoriesReply([wpCategoryFixture, wpCategoryFixture]),
      GetTags: tagsReply([wpTagFixture, { ...wpTagFixture, id: "dGVybTo1" }]),
    });

    const entries = await getAllSitemapEntries();
    const urls = entries.map((entry) => entry.url);
    assert.equal(new Set(urls).size, urls.length);
    assert.deepEqual(taxonomyPaths(entries), [
      "/blog/category/seo",
      "/blog/tag/local-seo",
    ]);
  });

  test("skips terms that cannot become a usable archive URL", async () => {
    cmsServes({
      GetCategories: categoriesReply([
        wpCategoryFixture,
        { ...wpCategoryFixture, id: "c1", slug: "", count: 2 },
        { ...wpCategoryFixture, id: "c2", slug: "   ", count: 2 },
        { ...wpCategoryFixture, id: "c3", slug: "parent/child", count: 2 },
        { ...wpCategoryFixture, id: "c4", slug: "q&a", count: 2 },
        { ...wpCategoryFixture, id: "c5", slug: "drafts-only", count: 0 },
        { ...wpCategoryFixture, id: "c6", slug: "uncounted", count: null },
      ]),
      GetTags: tagsReply([
        wpTagFixture,
        { ...wpTagFixture, id: "t1", slug: "" },
        { ...wpTagFixture, id: "t2", slug: "a/b" },
      ]),
    });

    assert.deepEqual(taxonomyPaths(await getAllSitemapEntries()), [
      "/blog/category/seo",
      "/blog/tag/local-seo",
    ]);
  });

  test("omits taxonomy URLs (only) when a taxonomy reply is malformed", async () => {
    cmsServes({
      GetCategories: {
        categories: { nodes: [{ id: "x" }], pageInfo: PAGE_INFO },
      },
      GetTags: tagsReply([wpTagFixture]),
      GetServices: {
        services: { nodes: [serviceNode("smm", 2)], pageInfo: PAGE_INFO },
      },
    });

    const entries = await getAllSitemapEntries();
    assert.deepEqual(taxonomyPaths(entries), []);
    assert.ok(entries.some((entry) => pathOf(entry.url) === "/services/smm"));
  });

  test("keeps every static, service, post and case-study entry alongside the archives", async () => {
    cmsServes({
      GetServices: {
        services: { nodes: [serviceNode("smm", 2)], pageInfo: PAGE_INFO },
      },
      GetPosts: { posts: { nodes: [wpPostFixture], pageInfo: PAGE_INFO } },
      GetCaseStudies: {
        caseStudies: { nodes: [wpCaseStudyFixture], pageInfo: PAGE_INFO },
      },
      GetCategories: categoriesReply([wpCategoryFixture]),
      GetTags: tagsReply([wpTagFixture]),
    });

    const entries = await getAllSitemapEntries();
    const paths = entries.map((entry) => pathOf(entry.url));
    assert.deepEqual(paths, [
      "/",
      "/about",
      "/services",
      "/blog",
      "/case-studies",
      "/contact",
      "/privacy-policy",
      "/terms-and-conditions",
      "/services/smm",
      `/blog/${wpPostFixture.slug}`,
      "/blog/category/seo",
      "/blog/tag/local-seo",
      `/case-studies/${wpCaseStudyFixture.slug}`,
    ]);
    assert.ok(
      entries.every((entry) =>
        entry.url.startsWith("https://www.tffdigital.com/"),
      ),
    );
  });
});
