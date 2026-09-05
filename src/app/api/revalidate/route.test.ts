import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe, mock } from "node:test";

// The WordPress → Next.js revalidation webhook (audit CACHE-1): a shared
// secret gates it, the body is validated before any path is named, and a
// valid call revalidates exactly the surfaces the content type maps to —
// never a site-wide purge. Unconfigured means disabled, not open.
const SECRET = "correct-horse-battery-staple";
process.env.WORDPRESS_REVALIDATE_SECRET = SECRET;
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";
process.env.WORDPRESS_USE_MOCK_DATA = "";

const revalidatePath = mock.fn();
// `namedExports` (not `exports`): on Node 22 the newer `exports` option is
// silently ignored and the mocked export comes back undefined.
mock.module("next/cache", { namedExports: { revalidatePath } });

const { POST } = await import("./route.ts");
const routeModule = await import("./route.ts");
const { NextRequest } = await import("next/server");

function request(
  body: unknown,
  {
    secret = SECRET,
    raw = false,
  }: { secret?: string | null; raw?: boolean } = {},
) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (secret !== null) headers.authorization = `Bearer ${secret}`;
  return new NextRequest("https://www.tffdigital.com/api/revalidate", {
    method: "POST",
    headers,
    body: raw ? (body as string) : JSON.stringify(body),
  });
}

const calls = () =>
  revalidatePath.mock.calls.map((call) => call.arguments as [string, string?]);

// The reachability probe: the CMS answers, or it does not.
const cmsUp = () =>
  mock.method(globalThis, "fetch", async () =>
    Response.json({ data: { __typename: "RootQuery" } }),
  );
const cmsDown = () =>
  mock.method(globalThis, "fetch", async () => {
    throw new TypeError("fetch failed");
  });

describe("POST /api/revalidate", () => {
  let warn: ReturnType<typeof mock.method>;

  beforeEach(() => {
    revalidatePath.mock.resetCalls();
    warn = mock.method(console, "warn", () => {});
    mock.method(console, "info", () => {});
    mock.method(console, "error", () => {});
  });
  afterEach(() => {
    mock.restoreAll();
    process.env.WORDPRESS_REVALIDATE_SECRET = SECRET;
  });

  test("only POST is exported — no GET can trigger a revalidation", () => {
    assert.equal(typeof routeModule.POST, "function");
    assert.equal("GET" in routeModule, false);
  });

  test("with no secret configured the endpoint is disabled (503) and revalidates nothing", async () => {
    process.env.WORDPRESS_REVALIDATE_SECRET = "";
    const fetchMock = cmsUp();
    const response = await POST(request({ type: "service", slug: "aeo-seo" }));
    assert.equal(response.status, 503);
    assert.equal(calls().length, 0);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  test("a missing, malformed or wrong secret is a 401 logged without the value, before any CMS contact", async () => {
    const fetchMock = cmsUp();
    for (const secret of [null, "", "wrong-guess-value", `${SECRET}x`]) {
      const response = await POST(
        request({ type: "service", slug: "aeo-seo" }, { secret }),
      );
      assert.equal(response.status, 401, `secret=${JSON.stringify(secret)}`);
    }
    const bare = new NextRequest("https://www.tffdigital.com/api/revalidate", {
      method: "POST",
      headers: { authorization: SECRET },
      body: JSON.stringify({ type: "service", slug: "aeo-seo" }),
    });
    assert.equal((await POST(bare)).status, 401);
    assert.equal(calls().length, 0);
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.doesNotMatch(
      JSON.stringify(warn.mock.calls.map((c) => c.arguments)),
      /wrong-guess-value/,
    );
  });

  test("malformed JSON and invalid payloads are 400 and revalidate nothing", async () => {
    const fetchMock = cmsUp();
    assert.equal((await POST(request("{not json", { raw: true }))).status, 400);
    const invalid: unknown[] = [
      {},
      { type: "portfolio", slug: "acme" },
      { type: "service" },
      { type: "service", slug: "" },
      { type: "service", slug: "../../etc" },
      { type: "service", slug: "aeo seo" },
      { type: "service", slug: "[slug]" },
      { type: "post", slug: "a".repeat(201) },
      null,
      "aeo-seo",
    ];
    for (const body of invalid) {
      const response = await POST(request(body));
      assert.equal(response.status, 400, `body=${JSON.stringify(body)}`);
      const json = (await response.json()) as {
        error: string;
        issues?: string[];
      };
      assert.equal(json.error, "Invalid payload");
      assert.ok(json.issues?.length);
    }
    assert.equal(calls().length, 0);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  test("with the CMS unreachable it revalidates nothing and answers 503, so cached pages keep serving", async () => {
    // revalidatePath() would leave the page with no stale fallback — a
    // healthy cached page must not become a 500 because an editor saved
    // during an outage (audit CACHE-1 vs INFRA-1).
    const fetchMock = cmsDown();
    const response = await POST(request({ type: "service", slug: "aeo-seo" }));
    assert.equal(response.status, 503);
    assert.equal(calls().length, 0);
    assert.equal(fetchMock.mock.callCount(), 1);
    const init = fetchMock.mock.calls[0].arguments[1] as RequestInit;
    assert.equal(init.cache, "no-store");
    assert.match(String(init.body), /RevalidateProbe/);
  });

  test("a valid service webhook revalidates exactly its page, the grid, the homepage and the sitemap", async () => {
    cmsUp();
    const response = await POST(
      request({ type: "service", slug: "aeo-seo", event: "publish" }),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      revalidated: true,
      type: "service",
      slug: "aeo-seo",
      paths: ["/services/aeo-seo", "/services", "/", "/sitemap.xml"],
    });
    assert.deepEqual(calls(), [
      ["/services/aeo-seo", undefined],
      ["/services", undefined],
      ["/", undefined],
      ["/sitemap.xml", undefined],
    ]);
  });

  test("a post webhook also revalidates the archive patterns, and a deletion maps identically", async () => {
    cmsUp();
    const response = await POST(
      request({
        type: "post",
        slug: "seo-for-small-businesses",
        event: "delete",
      }),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(calls(), [
      ["/blog/seo-for-small-businesses", undefined],
      ["/blog", undefined],
      ["/blog/category/[slug]", "page"],
      ["/blog/tag/[slug]", "page"],
      ["/sitemap.xml", undefined],
    ]);
  });

  test("a page webhook revalidates only its own path and the sitemap (CLIENT-1)", async () => {
    cmsUp();
    const response = await POST(
      request({ type: "page", slug: "our-story", event: "publish" }),
    );
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      revalidated: true,
      type: "page",
      slug: "our-story",
      paths: ["/our-story", "/sitemap.xml"],
    });
    assert.deepEqual(calls(), [
      ["/our-story", undefined],
      ["/sitemap.xml", undefined],
    ]);
  });

  test("a page webhook naming a reserved slug is accepted but revalidates nothing", async () => {
    cmsUp();
    const response = await POST(request({ type: "page", slug: "about" }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), {
      revalidated: true,
      type: "page",
      slug: "about",
      paths: [],
    });
    assert.equal(revalidatePath.mock.callCount(), 0);
  });

  test("never issues a layout-wide purge, and strips unknown fields from the body", async () => {
    cmsUp();
    const response = await POST(
      request({
        type: "case-study",
        slug: "chicabebo",
        paths: ["/"],
        kind: "layout",
      }),
    );
    assert.equal(response.status, 200);
    for (const [, kind] of calls()) assert.notEqual(kind, "layout");
    assert.deepEqual(
      calls().map(([path]) => path),
      ["/case-studies/chicabebo", "/case-studies", "/", "/sitemap.xml"],
    );
  });

  test("a revalidatePath failure is a 500, not an unhandled error", async () => {
    cmsUp();
    revalidatePath.mock.mockImplementationOnce(() => {
      throw new Error("Invariant: static generation store missing");
    });
    const response = await POST(request({ type: "service", slug: "aeo-seo" }));
    assert.equal(response.status, 500);
  });
});
