import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe, mock } from "node:test";

import { wpCaseStudyFixture } from "../../../../../test/fixtures/wp-content.ts";

// The preview-auth boundary end to end, through the real route handler,
// service, repository and GraphQL client — only the network (fetch) and
// Next's request-scoped draftMode() are stubbed. Exercises the two gates
// the route documents: the shared secret (401 before any CMS contact) and
// the WordPress-authenticated draft fetch (Basic auth, never cached).
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";
process.env.WORDPRESS_USE_MOCK_DATA = "";
process.env.WORDPRESS_PREVIEW_SECRET = "correct-horse-battery-staple";
process.env.WORDPRESS_PREVIEW_USERNAME = "editor";
process.env.WORDPRESS_PREVIEW_APP_PASSWORD = "abcd efgh ijkl";

const enable = mock.fn();
const disable = mock.fn();
// `namedExports` (not `exports`): on Node 22 the newer `exports` option is
// silently ignored and the mocked export comes back undefined.
mock.module("next/headers", {
  namedExports: {
    draftMode: async () => ({ enable, disable, isEnabled: false }),
  },
});

const { GET } = await import("./route.ts");
const { NextRequest } = await import("next/server");

const SECRET = "correct-horse-battery-staple";

function request(query: Record<string, string>) {
  const url = new URL("https://www.tffdigital.com/api/preview/case-study");
  for (const [key, value] of Object.entries(query))
    url.searchParams.set(key, value);
  return new NextRequest(url);
}

function previewResponse(caseStudy: unknown) {
  return mock.method(globalThis, "fetch", async () =>
    Response.json({ data: { caseStudy } }),
  );
}

describe("GET /api/preview/case-study", () => {
  let warn: ReturnType<typeof mock.method>;
  let error: ReturnType<typeof mock.method>;

  beforeEach(() => {
    enable.mock.resetCalls();
    warn = mock.method(console, "warn", () => {});
    error = mock.method(console, "error", () => {});
  });
  afterEach(() => mock.restoreAll());

  test("a wrong secret is a generic 401 that never reaches WordPress and never logs the value", async () => {
    const fetchMock = previewResponse(null);

    const response = await GET(
      request({ secret: "wrong-guess-value", id: "7" }),
    );

    assert.equal(response.status, 401);
    assert.equal(await response.text(), "Invalid preview secret");
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.equal(enable.mock.callCount(), 0);
    // LOG-1: the attempt leaves a trace, but the attempted value must not.
    assert.equal(warn.mock.callCount(), 1);
    const logged = JSON.stringify(warn.mock.calls[0].arguments);
    assert.doesNotMatch(logged, /wrong-guess-value/);
    assert.match(logged, /hadSecret/);
  });

  test("a missing secret gets the same 401 as a wrong one", async () => {
    const response = await GET(request({ id: "7" }));
    assert.equal(response.status, 401);
    assert.equal(await response.text(), "Invalid preview secret");
  });

  test("a missing or non-positive-integer id is a 400 after the secret check", async () => {
    const fetchMock = previewResponse(null);
    const queries: Record<string, string>[] = [
      { secret: SECRET },
      { secret: SECRET, id: "abc" },
      { secret: SECRET, id: "0" },
    ];
    for (const query of queries) {
      const response = await GET(request(query));
      assert.equal(response.status, 400, JSON.stringify(query));
    }
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  test("a valid request fetches the draft with Basic auth, uncached, enables draft mode and redirects to the slug", async () => {
    const fetchMock = previewResponse({
      ...wpCaseStudyFixture,
      databaseId: 7,
      status: "draft",
    });

    const response = await GET(request({ secret: SECRET, id: "7" }));

    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      "https://www.tffdigital.com/case-studies/stabilizing-and-scaling-seo?preview=true",
    );
    assert.equal(enable.mock.callCount(), 1);

    assert.equal(fetchMock.mock.callCount(), 1);
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
      id: "7",
      idType: "DATABASE_ID",
      asPreview: true,
    });
  });

  test("an unknown id and the placeholder 'test' entry both 404 without enabling draft mode", async () => {
    const notFound = previewResponse(null);
    assert.equal(
      (await GET(request({ secret: SECRET, id: "404" }))).status,
      404,
    );

    notFound.mock.restore();
    previewResponse({ ...wpCaseStudyFixture, slug: "test", databaseId: 3 });
    assert.equal((await GET(request({ secret: SECRET, id: "3" }))).status, 404);

    assert.equal(enable.mock.callCount(), 0);
  });

  test("a CMS outage is a 502 with a generic body; the detail stays server-side", async () => {
    mock.method(globalThis, "fetch", async () => {
      throw new TypeError("fetch failed");
    });

    const response = await GET(request({ secret: SECRET, id: "7" }));

    assert.equal(response.status, 502);
    assert.equal(
      await response.text(),
      "Could not load the preview right now.",
    );
    assert.equal(error.mock.callCount(), 1);
    assert.equal(enable.mock.callCount(), 0);
  });

  test("missing WordPress preview credentials are a 500, distinct from an outage", async () => {
    const fetchMock = previewResponse(null);
    const password = process.env.WORDPRESS_PREVIEW_APP_PASSWORD;
    delete process.env.WORDPRESS_PREVIEW_APP_PASSWORD;
    try {
      const response = await GET(request({ secret: SECRET, id: "7" }));
      assert.equal(response.status, 500);
      assert.equal(fetchMock.mock.callCount(), 0);
    } finally {
      process.env.WORDPRESS_PREVIEW_APP_PASSWORD = password;
    }
  });
});
