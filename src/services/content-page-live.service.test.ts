import assert from "node:assert/strict";
import test, { beforeEach, describe, mock } from "node:test";

import { wpPageFixture } from "../../test/fixtures/wp-content.ts";

// CLIENT-1: a healthy live-WordPress reply flowing through the full
// boundary parse + adapter chain for getPages specifically — the outage
// path alone is covered by outage-resilience.test.ts. Separate file/
// process from content-page-mock-mode.service.test.ts (see its comment).
process.env.WORDPRESS_USE_MOCK_DATA = "";
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";

const { getPages } = await import("./content-page.service.ts");

describe("content-page.service — live WordPress", () => {
  beforeEach(() => {
    mock.method(console, "error", () => {});
  });

  test("getPages adapts a healthy reply through the full boundary chain", async () => {
    mock.method(globalThis, "fetch", async () =>
      Response.json({
        data: {
          pages: {
            nodes: [
              wpPageFixture,
              { ...wpPageFixture, id: "p2", slug: "careers", title: "Careers" },
            ],
            pageInfo: {
              hasNextPage: false,
              hasPreviousPage: false,
              startCursor: "a",
              endCursor: "b",
            },
          },
        },
      }),
    );

    const result = await getPages();
    assert.equal(result.totalCount, 2);
    assert.deepEqual(
      result.items.map((page) => page.slug),
      ["about", "careers"],
    );
    assert.equal(result.items[0].content, "<p>About us.</p>");
  });
});
