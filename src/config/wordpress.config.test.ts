import assert from "node:assert/strict";
import test, { describe, mock } from "node:test";

// ARCH-3: mock WordPress content is a development convenience that must
// never reach a production build. The environment model is NODE_ENV, the
// same one next.config.ts keys on: `next dev` is "development", `next
// build`/`next start` are "production", the test runner leaves it unset.
// Next types NODE_ENV as read-only; the test runner may set it freely.
(process.env as Record<string, string | undefined>).NODE_ENV = "production";
process.env.WORDPRESS_USE_MOCK_DATA = "true";
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";

const error = mock.method(console, "error", () => {});
const { resolveUseMockData, wordpressConfig } =
  await import("./wordpress.config.ts");
error.mock.restore();

const ENDPOINT = "https://cms.example.test/graphql";

describe("resolveUseMockData", () => {
  test("outside production, the flag or a missing endpoint enables mock data", () => {
    for (const NODE_ENV of ["development", "test", undefined]) {
      assert.equal(
        resolveUseMockData({
          NODE_ENV,
          WORDPRESS_USE_MOCK_DATA: "true",
          WORDPRESS_GRAPHQL_ENDPOINT: ENDPOINT,
        }),
        true,
        `flag, NODE_ENV=${NODE_ENV}`,
      );
      assert.equal(
        resolveUseMockData({ NODE_ENV, WORDPRESS_GRAPHQL_ENDPOINT: "" }),
        true,
        `no endpoint, NODE_ENV=${NODE_ENV}`,
      );
      assert.equal(
        resolveUseMockData({ NODE_ENV }),
        true,
        `nothing set, NODE_ENV=${NODE_ENV}`,
      );
    }
  });

  test("outside production, a configured endpoint without the flag uses WordPress", () => {
    for (const WORDPRESS_USE_MOCK_DATA of [
      "false",
      "",
      "TRUE",
      "1",
      undefined,
    ]) {
      assert.equal(
        resolveUseMockData({
          NODE_ENV: "development",
          WORDPRESS_USE_MOCK_DATA,
          WORDPRESS_GRAPHQL_ENDPOINT: ENDPOINT,
        }),
        false,
        `flag=${JSON.stringify(WORDPRESS_USE_MOCK_DATA)}`,
      );
    }
  });

  test("in production, mock data is never enabled — not by the flag, not by a missing endpoint", () => {
    assert.equal(
      resolveUseMockData({
        NODE_ENV: "production",
        WORDPRESS_USE_MOCK_DATA: "true",
        WORDPRESS_GRAPHQL_ENDPOINT: ENDPOINT,
      }),
      false,
    );
    assert.equal(
      resolveUseMockData({
        NODE_ENV: "production",
        WORDPRESS_USE_MOCK_DATA: "true",
        WORDPRESS_GRAPHQL_ENDPOINT: "",
      }),
      false,
    );
    assert.equal(resolveUseMockData({ NODE_ENV: "production" }), false);
    assert.equal(
      resolveUseMockData({
        NODE_ENV: "production",
        WORDPRESS_GRAPHQL_ENDPOINT: ENDPOINT,
      }),
      false,
    );
  });
});

describe("wordpressConfig in a production process with the flag set", () => {
  test("ignores the flag, keeps the endpoint, and logs the misconfiguration once without values", () => {
    assert.equal(wordpressConfig.useMockData, false);
    assert.equal(wordpressConfig.graphqlEndpoint, ENDPOINT);
    assert.equal(error.mock.callCount(), 1);
    const logged = String(error.mock.calls[0].arguments[0]);
    assert.match(
      logged,
      /WORDPRESS_USE_MOCK_DATA=true is ignored in production/,
    );
    assert.doesNotMatch(logged, /cms\.example\.test/);
  });
});
