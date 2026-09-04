import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe, mock } from "node:test";

import { wpCaseStudyFixture } from "../../test/fixtures/wp-content.ts";

// The WordPress-outage resilience decision (audit DEP-2's named flow, the
// one Phase 5 verified live against a broken endpoint): every service has a
// soft getter for secondary surfaces that swallows a CMS failure into an
// empty result (logged once), and a strict/by-slug getter for a page's
// primary content that rethrows so the route's error boundary answers with
// a 5xx — never a 200 claiming the content doesn't exist, which could get
// real pages de-indexed.
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";
process.env.WORDPRESS_USE_MOCK_DATA = "";

const caseStudies = await import("./case-study.service.ts");
const posts = await import("./post.service.ts");
const taxonomy = await import("./taxonomy.service.ts");
const services = await import("./service-offering.service.ts");
const { WordPressError } = await import("../lib/wordpress/errors.ts");

const EMPTY_PAGE = {
  items: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  },
  totalCount: 0,
};

function cmsIsDown() {
  return mock.method(globalThis, "fetch", async () => {
    throw new TypeError("fetch failed");
  });
}

const rejectsWithNetworkError = (error: unknown) =>
  error instanceof WordPressError && error.kind === "network";

describe("WordPress outage handling in the service layer", () => {
  let error: ReturnType<typeof mock.method>;

  beforeEach(() => {
    error = mock.method(console, "error", () => {});
  });
  afterEach(() => mock.restoreAll());

  test("soft listing getters degrade to empty results and log once each", async () => {
    cmsIsDown();

    assert.deepEqual(await caseStudies.getCaseStudies(), EMPTY_PAGE);
    assert.deepEqual(await posts.getPosts(), EMPTY_PAGE);
    assert.deepEqual(await posts.getPostsByCategory("seo"), EMPTY_PAGE);
    assert.deepEqual(await posts.getPostsByTag("local"), EMPTY_PAGE);
    assert.deepEqual(await posts.getPostsBySearch("seo"), EMPTY_PAGE);
    assert.deepEqual(await taxonomy.getCategories(), []);
    assert.deepEqual(await taxonomy.getTags(), []);
    assert.deepEqual(await services.getServiceOfferings(), EMPTY_PAGE);

    assert.equal(error.mock.callCount(), 8);
  });

  test("strict listing getters rethrow the typed error for the error boundary", async () => {
    cmsIsDown();

    for (const run of [
      () => caseStudies.getCaseStudiesStrict(),
      () => posts.getPostsStrict(),
      () => posts.getPostsBySearchStrict("seo"),
      () => taxonomy.getCategoriesStrict(),
      () => taxonomy.getTagsStrict(),
    ]) {
      await assert.rejects(run, rejectsWithNetworkError);
    }
  });

  test("by-slug getters rethrow: an outage must never turn into a 404", async () => {
    cmsIsDown();

    for (const run of [
      () => caseStudies.getCaseStudyBySlug("stabilizing-and-scaling-seo"),
      () => posts.getPostBySlug("seo-for-small-businesses"),
      () => services.getServiceOfferingBySlug("search-engine-optimization"),
    ]) {
      await assert.rejects(run, rejectsWithNetworkError);
    }
  });

  test("a healthy CMS reply flows through the boundary parse and adapter", async () => {
    mock.method(globalThis, "fetch", async () =>
      Response.json({
        data: {
          caseStudies: {
            nodes: [wpCaseStudyFixture],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: "a",
              endCursor: "a",
            },
          },
        },
      }),
    );

    const page = await caseStudies.getCaseStudiesStrict();

    assert.equal(page.totalCount, 1);
    assert.equal(page.items[0].slug, "stabilizing-and-scaling-seo");
    assert.equal(page.items[0].challenge, "<p>The challenge.</p>");
    assert.equal(error.mock.callCount(), 0);
  });
});
