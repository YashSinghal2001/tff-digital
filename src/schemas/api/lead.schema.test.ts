import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { ZodError } from "zod";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import { wpLeadResponseSchema } from "./lead.schema.ts";
import { parseWordPressResponse } from "../../lib/wordpress/parse-response.ts";
import { isWordPressError } from "../../lib/wordpress/errors.ts";

// Audit FORM-RT-1's discrimination half: a malformed WordPress lead
// response must surface as WordPressError(kind "parse") — never as a raw
// ZodError, which the contact Server Action would misread as a form-input
// failure ("check the highlighted fields").

describe("wpLeadResponseSchema via parseWordPressResponse", () => {
  test("passes a valid success response through deep-equal", () => {
    const full = { id: 123, status: "success", message: "Lead saved" };
    assert.deepEqual(
      parseWordPressResponse(wpLeadResponseSchema, full, "createLead"),
      full,
    );
    const minimal = { id: 123, status: "success" };
    assert.deepEqual(
      parseWordPressResponse(wpLeadResponseSchema, minimal, "createLead"),
      minimal,
    );
  });

  test('accepts status:"error" as a legal wire value', () => {
    // Discrimination to success:false happens post-parse in
    // contact.service.ts (`response.status === "success"`), which is
    // server-only and not loadable here — covered by the empirical
    // harness. This pins that shape validation cannot reject the legal
    // error value.
    const errorBody = { id: 1, status: "error", message: "Could not save" };
    assert.deepEqual(
      parseWordPressResponse(wpLeadResponseSchema, errorBody, "createLead"),
      errorBody,
    );
  });

  test("malformed shapes throw WordPressError kind 'parse', never ZodError", () => {
    const malformed: unknown[] = [
      {},
      { id: "1", status: "success" },
      { id: 1, status: "ok" },
      null,
    ];
    for (const shape of malformed) {
      assert.throws(
        () => parseWordPressResponse(wpLeadResponseSchema, shape, "createLead"),
        (error: unknown) => {
          assert.equal(isWordPressError(error), true);
          assert.equal(
            (error as { kind?: string }).kind,
            "parse",
            `kind for ${JSON.stringify(shape)}`,
          );
          assert.equal(error instanceof ZodError, false);
          return true;
        },
      );
    }
  });

  test("reports the failing field by path and code", () => {
    const badId = wpLeadResponseSchema.safeParse({
      id: "1",
      status: "success",
    });
    assert.equal(badId.success, false);
    assert.deepEqual(badId.error?.issues[0]?.path, ["id"]);
    assert.equal(badId.error?.issues[0]?.code, "invalid_type");

    const badStatus = wpLeadResponseSchema.safeParse({ id: 1, status: "ok" });
    assert.equal(badStatus.success, false);
    assert.deepEqual(badStatus.error?.issues[0]?.path, ["status"]);
    assert.equal(badStatus.error?.issues[0]?.code, "invalid_value");
  });

  test("never embeds response values in the thrown message", () => {
    assert.throws(
      () =>
        parseWordPressResponse(
          wpLeadResponseSchema,
          { id: "jane@example.com", status: "success" },
          "createLead",
        ),
      (error: unknown) => {
        const message = (error as Error).message;
        assert.match(message, /createLead/);
        assert.match(message, /id: invalid_type/);
        assert.doesNotMatch(message, /jane@example\.com/);
        return true;
      },
    );
  });

  test("strips unknown extra fields instead of failing", () => {
    const parsed = parseWordPressResponse(
      wpLeadResponseSchema,
      { id: 1, status: "success", yoast: "x" },
      "createLead",
    );
    assert.deepEqual(parsed, { id: 1, status: "success" });
  });
});
