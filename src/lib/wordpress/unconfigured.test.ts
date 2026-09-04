import assert from "node:assert/strict";
import test, { afterEach, describe, mock } from "node:test";

// The config modules read process.env once at import, so the "nothing
// configured" behaviour gets its own process: with every WordPress variable
// unset, each boundary must fail closed with a typed 'config' error (or a
// plain `false` for the preview secret) and never issue a network request.
for (const key of [
  "WORDPRESS_GRAPHQL_ENDPOINT",
  "WORDPRESS_REST_URL",
  "WORDPRESS_PREVIEW_SECRET",
  "WORDPRESS_PREVIEW_USERNAME",
  "WORDPRESS_PREVIEW_APP_PASSWORD",
]) {
  delete process.env[key];
}

const { fetchGraphQL } = await import("./client.ts");
const { postToWordPress } = await import("./rest-client.ts");
const { isValidPreviewSecret } = await import("./preview-request.ts");
const { buildPreviewAuthHeaders } = await import("./preview-auth.ts");
const { WordPressError } = await import("./errors.ts");
const { submitContactFormAction } =
  await import("../../features/contact/actions.ts");

describe("WordPress boundaries with nothing configured", () => {
  afterEach(() => mock.restoreAll());

  test("GraphQL and REST clients throw 'config' errors before touching the network", async () => {
    const fetchMock = mock.method(globalThis, "fetch", async () =>
      Response.json({}),
    );

    for (const run of [
      () => fetchGraphQL("query { x }"),
      () => postToWordPress("/headless/v1/leads", {}),
    ]) {
      await assert.rejects(
        run,
        (error: unknown) =>
          error instanceof WordPressError && error.kind === "config",
      );
    }
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  test("an unset preview secret rejects every candidate, including the empty string", () => {
    assert.equal(isValidPreviewSecret(""), false);
    assert.equal(isValidPreviewSecret(null), false);
    assert.equal(isValidPreviewSecret("anything"), false);
  });

  test("the contact form reports the missing WordPress connection instead of a generic failure", async () => {
    mock.method(console, "error", () => {});
    const result = await submitContactFormAction({
      name: "Ada Lovelace",
      email: "ada@example.test",
      serviceInterest: "SEO",
      budget: "$5k-$10k",
      message: "We need help with our search rankings this quarter.",
      consent: true,
    });
    assert.equal(result.success, false);
    assert.match(result.message, /isn't connected to WordPress yet/);
  });

  test("preview auth headers cannot be built without both credentials", () => {
    assert.throws(
      () => buildPreviewAuthHeaders(),
      (error: unknown) =>
        error instanceof WordPressError && error.kind === "config",
    );
  });
});
