import assert from "node:assert/strict";
import test, { afterEach, describe, mock } from "node:test";

// The REST transport under the contact-form lead pipeline: a CMS outage
// must fail as a typed WordPressError the Server Action can turn into the
// visitor-facing "couldn't reach our server" state (audit DEP-2 lead path).
process.env.WORDPRESS_REST_URL = "https://cms.example.test/wp-json";

const { postToWordPress } = await import("./rest-client.ts");
const { WordPressError } = await import("./errors.ts");

describe("postToWordPress", () => {
  afterEach(() => mock.restoreAll());

  test("POSTs the JSON body to the REST root plus path and returns the parsed reply", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () =>
      Response.json({ id: 9, status: "success" }),
    );

    const reply = await postToWordPress<{ id: number; status: string }>(
      "/headless/v1/leads",
      { name: "Ada" },
    );

    assert.deepEqual(reply, { id: 9, status: "success" });
    const [url, init] = fetchMock.mock.calls[0].arguments as [
      string,
      RequestInit,
    ];
    assert.equal(url, "https://cms.example.test/wp-json/headless/v1/leads");
    assert.equal(init.method, "POST");
    assert.equal(init.body, JSON.stringify({ name: "Ada" }));
    assert.ok(
      init.signal instanceof AbortSignal,
      "request carries an abort signal",
    );
  });

  for (const [label, respond, kind, part] of [
    [
      "a connection failure",
      async () => {
        throw new TypeError("fetch failed");
      },
      "network",
      "Could not reach WordPress REST API",
    ],
    [
      "a hung server",
      async () => {
        throw new DOMException("timeout", "TimeoutError");
      },
      "network",
      "timed out after 8000ms",
    ],
    [
      "a 500 reply",
      async () => new Response("", { status: 500 }),
      "http",
      "500",
    ],
    [
      "a non-JSON reply",
      async () => new Response("<html>"),
      "parse",
      "non-JSON",
    ],
  ] as const) {
    test(`${label} becomes a WordPressError of kind '${kind}'`, async () => {
      mock.method(globalThis, "fetch", respond);
      await assert.rejects(
        () => postToWordPress("/headless/v1/leads", {}),
        (error: unknown) =>
          error instanceof WordPressError &&
          error.kind === kind &&
          new RegExp(part).test(error.message),
      );
    });
  }
});
