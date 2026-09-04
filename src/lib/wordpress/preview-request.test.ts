import assert from "node:assert/strict";
import test, { describe } from "node:test";

// The preview-auth boundary (audit DEP-2's first-named path): the shared
// secret gate every /api/preview/<type> route runs before contacting
// WordPress, and the Basic-Auth credential builder behind the draft fetch.
process.env.WORDPRESS_PREVIEW_SECRET = "correct-horse-battery-staple";
process.env.WORDPRESS_PREVIEW_USERNAME = "editor";
process.env.WORDPRESS_PREVIEW_APP_PASSWORD = "abcd efgh ijkl";

const { isValidPreviewSecret, parsePreviewId } =
  await import("./preview-request.ts");
const { buildPreviewAuthHeaders } = await import("./preview-auth.ts");
const { WordPressError } = await import("./errors.ts");

describe("isValidPreviewSecret", () => {
  test("accepts only the exact configured secret", () => {
    assert.equal(isValidPreviewSecret("correct-horse-battery-staple"), true);
  });

  test("rejects a same-length wrong value, a wrong-length value, empty and null", () => {
    assert.equal(isValidPreviewSecret("correct-horse-battery-stapl3"), false);
    assert.equal(isValidPreviewSecret("correct-horse-battery-staple-x"), false);
    assert.equal(isValidPreviewSecret("correct"), false);
    assert.equal(isValidPreviewSecret(""), false);
    assert.equal(isValidPreviewSecret(null), false);
  });
});

describe("parsePreviewId", () => {
  test("accepts positive integers only", () => {
    assert.equal(parsePreviewId("12"), 12);
    for (const bad of ["0", "-1", "1.5", "abc", "", null]) {
      assert.equal(parsePreviewId(bad), null, `id=${JSON.stringify(bad)}`);
    }
  });
});

describe("buildPreviewAuthHeaders", () => {
  test("encodes the Application Password as HTTP Basic auth", () => {
    assert.deepEqual(buildPreviewAuthHeaders(), {
      Authorization: `Basic ${Buffer.from("editor:abcd efgh ijkl").toString("base64")}`,
    });
  });

  test("throws a 'config' error when either credential is missing", () => {
    const password = process.env.WORDPRESS_PREVIEW_APP_PASSWORD;
    delete process.env.WORDPRESS_PREVIEW_APP_PASSWORD;
    try {
      assert.throws(
        () => buildPreviewAuthHeaders(),
        (error: unknown) =>
          error instanceof WordPressError && error.kind === "config",
      );
    } finally {
      process.env.WORDPRESS_PREVIEW_APP_PASSWORD = password;
    }
  });
});
