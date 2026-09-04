import assert from "node:assert/strict";
import test, { describe, mock } from "node:test";

// The shared draft-mode off switch: clears the cookie and leaves the editor
// on the public homepage.
const disable = mock.fn();
mock.module("next/headers", {
  namedExports: {
    draftMode: async () => ({ enable() {}, disable, isEnabled: true }),
  },
});

const { GET } = await import("./route.ts");
const { NextRequest } = await import("next/server");

describe("GET /api/preview/disable", () => {
  test("disables draft mode and redirects to the homepage on the same origin", async () => {
    const response = await GET(
      new NextRequest("https://www.tffdigital.com/api/preview/disable"),
    );

    assert.equal(disable.mock.callCount(), 1);
    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      "https://www.tffdigital.com/",
    );
  });
});
