import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe, mock } from "node:test";

import { wpServiceOfferingFixture } from "../../../../../test/fixtures/wp-content.ts";

// The Service twin of case-study/route.test.ts: same two-gate preview-auth
// boundary (shared secret, then WordPress-authenticated uncached draft
// fetch), pinned separately because the routes are separate files.
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";
process.env.WORDPRESS_USE_MOCK_DATA = "";
process.env.WORDPRESS_PREVIEW_SECRET = "correct-horse-battery-staple";
process.env.WORDPRESS_PREVIEW_USERNAME = "editor";
process.env.WORDPRESS_PREVIEW_APP_PASSWORD = "abcd efgh ijkl";

const enable = mock.fn();
// `namedExports` (not `exports`): on Node 22 the newer `exports` option is
// silently ignored and the mocked export comes back undefined.
mock.module("next/headers", {
  namedExports: {
    draftMode: async () => ({ enable, disable() {}, isEnabled: false }),
  },
});

const { GET } = await import("./route.ts");
const { NextRequest } = await import("next/server");

const SECRET = "correct-horse-battery-staple";

function request(query: Record<string, string>) {
  const url = new URL("https://www.tffdigital.com/api/preview/service");
  for (const [key, value] of Object.entries(query))
    url.searchParams.set(key, value);
  return new NextRequest(url);
}

describe("GET /api/preview/service", () => {
  let warn: ReturnType<typeof mock.method>;

  beforeEach(() => {
    enable.mock.resetCalls();
    warn = mock.method(console, "warn", () => {});
    mock.method(console, "error", () => {});
  });
  afterEach(() => mock.restoreAll());

  test("a wrong secret is a generic 401 before any CMS contact, logged without the value", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () =>
      Response.json({}),
    );

    const response = await GET(
      request({ secret: "wrong-guess-value", id: "5" }),
    );

    assert.equal(response.status, 401);
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.equal(enable.mock.callCount(), 0);
    assert.doesNotMatch(
      JSON.stringify(warn.mock.calls[0].arguments),
      /wrong-guess-value/,
    );
  });

  test("a missing or invalid id is a 400", async () => {
    assert.equal((await GET(request({ secret: SECRET }))).status, 400);
    assert.equal((await GET(request({ secret: SECRET, id: "x" }))).status, 400);
  });

  test("a valid request fetches the draft with Basic auth, uncached, and redirects to the service", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () =>
      Response.json({
        data: { service: { ...wpServiceOfferingFixture, databaseId: 5 } },
      }),
    );

    const response = await GET(request({ secret: SECRET, id: "5" }));

    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      "https://www.tffdigital.com/services/search-engine-optimization?preview=true",
    );
    assert.equal(enable.mock.callCount(), 1);
    const init = fetchMock.mock.calls[0].arguments[1] as RequestInit & {
      next?: unknown;
    };
    assert.equal(
      (init.headers as Record<string, string>).Authorization,
      `Basic ${Buffer.from("editor:abcd efgh ijkl").toString("base64")}`,
    );
    assert.equal(init.cache, "no-store");
    assert.equal(init.next, undefined);
    assert.deepEqual(JSON.parse(String(init.body)).variables, {
      id: "5",
      idType: "DATABASE_ID",
      asPreview: true,
    });
  });

  test("an unknown id is a 404 and an outage a 502, neither enabling draft mode", async () => {
    const notFound = mock.method(globalThis, "fetch", async () =>
      Response.json({ data: { service: null } }),
    );
    assert.equal(
      (await GET(request({ secret: SECRET, id: "404" }))).status,
      404,
    );
    notFound.mock.restore();

    mock.method(globalThis, "fetch", async () => {
      throw new TypeError("fetch failed");
    });
    assert.equal((await GET(request({ secret: SECRET, id: "5" }))).status, 502);
    assert.equal(enable.mock.callCount(), 0);
  });
});
