import assert from "node:assert/strict";
import test, { afterEach, describe, mock } from "node:test";

// Outage-resilience contract of the one WPGraphQL transport every service
// goes through (audit DEP-2's "WordPress-outage resilience" path): each
// failure class becomes a typed WordPressError so callers can choose
// between "render without this section" and "surface the error boundary",
// and the default request carries the 30s ISR window (audit CACHE-1).
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";
process.env.WORDPRESS_USE_MOCK_DATA = "";

const { fetchGraphQL } = await import("./client.ts");
const { WordPressError } = await import("./errors.ts");

type RecordedInit = RequestInit & { next?: { revalidate?: number } };

function stubFetch(respond: () => Promise<Response>) {
  return mock.method(globalThis, "fetch", async () => respond());
}

function lastInit(fetchMock: ReturnType<typeof stubFetch>): RecordedInit {
  return fetchMock.mock.calls[0]?.arguments[1] as RecordedInit;
}

async function expectWordPressError(
  run: () => Promise<unknown>,
  kind: string,
  messagePart?: string,
) {
  await assert.rejects(run, (error: unknown) => {
    assert.ok(error instanceof WordPressError, "expected a WordPressError");
    assert.equal(error.kind, kind);
    if (messagePart) assert.match(error.message, new RegExp(messagePart));
    return true;
  });
}

describe("fetchGraphQL", () => {
  afterEach(() => mock.restoreAll());

  test("posts the query as JSON and returns the data field", async () => {
    const fetchMock = stubFetch(async () =>
      Response.json({ data: { posts: { nodes: [] } } }),
    );

    const data = await fetchGraphQL<{ posts: { nodes: unknown[] } }>(
      "query Q($first: Int) { posts(first: $first) { nodes { id } } }",
      { first: 3 },
    );

    assert.deepEqual(data, { posts: { nodes: [] } });
    assert.equal(fetchMock.mock.callCount(), 1);
    assert.equal(
      fetchMock.mock.calls[0].arguments[0],
      "https://cms.example.test/graphql",
    );
    const init = lastInit(fetchMock);
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(String(init.body)), {
      query: "query Q($first: Int) { posts(first: $first) { nodes { id } } }",
      variables: { first: 3 },
    });
    assert.equal(
      (init.headers as Record<string, string>)["Content-Type"],
      "application/json",
    );
  });

  test("defaults every public fetch to the 30s ISR window with a timeout signal", async () => {
    const fetchMock = stubFetch(async () => Response.json({ data: {} }));

    await fetchGraphQL("query { x }");

    const init = lastInit(fetchMock);
    assert.deepEqual(init.next, { revalidate: 30 });
    assert.equal(init.cache, undefined);
    assert.ok(
      init.signal instanceof AbortSignal,
      "request carries an abort signal",
    );
  });

  test("an explicit cache option replaces the ISR window and extra headers merge in", async () => {
    const fetchMock = stubFetch(async () => Response.json({ data: {} }));

    await fetchGraphQL("query { x }", undefined, {
      cache: "no-store",
      headers: { Authorization: "Basic abc" },
    });

    const init = lastInit(fetchMock);
    assert.equal(init.cache, "no-store");
    assert.equal(
      init.next,
      undefined,
      "cache and next.revalidate never combine",
    );
    assert.deepEqual(init.headers, {
      "Content-Type": "application/json",
      Authorization: "Basic abc",
    });
  });

  test("an unreachable CMS becomes a 'network' error, never a bare TypeError", async () => {
    stubFetch(async () => {
      throw new TypeError("fetch failed");
    });
    await expectWordPressError(
      () => fetchGraphQL("query { x }"),
      "network",
      "Could not reach WPGraphQL",
    );
  });

  test("a hung CMS surfaces as a 'network' error naming the 8s timeout", async () => {
    stubFetch(async () => {
      throw new DOMException(
        "The operation was aborted due to timeout",
        "TimeoutError",
      );
    });
    await expectWordPressError(
      () => fetchGraphQL("query { x }"),
      "network",
      "timed out after 8000ms",
    );
  });

  test("a non-2xx response becomes an 'http' error carrying the status", async () => {
    stubFetch(async () => new Response("Service Unavailable", { status: 503 }));
    await expectWordPressError(
      () => fetchGraphQL("query { x }"),
      "http",
      "503",
    );
  });

  test("a non-JSON body (e.g. a host error page) becomes a 'parse' error", async () => {
    stubFetch(async () => new Response("<html>Bandwidth exceeded</html>"));
    await expectWordPressError(() => fetchGraphQL("query { x }"), "parse");
  });

  test("GraphQL-level errors become a 'graphql' error listing the messages", async () => {
    stubFetch(async () =>
      Response.json({
        errors: [{ message: "Cannot query field" }, { message: "Nope" }],
      }),
    );
    await expectWordPressError(
      () => fetchGraphQL("query { x }"),
      "graphql",
      "Cannot query field; Nope",
    );
  });

  test("a 200 without a data field is a 'parse' error, not undefined data", async () => {
    stubFetch(async () => Response.json({}));
    await expectWordPressError(() => fetchGraphQL("query { x }"), "parse");
  });
});
