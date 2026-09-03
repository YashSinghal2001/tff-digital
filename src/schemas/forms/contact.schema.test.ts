import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import { contactFormSchema } from "./contact.schema.ts";

// Focused on audit FORM-RT-1's .max() half: the message cap must match the
// WordPress plugin's TFF_HEADLESS_LEADS_MAX_MESSAGE (5000) so an oversized
// message becomes an inline field error instead of a WP 400 surfacing as a
// misleading generic server error.

const valid = {
  name: "Jane Doe",
  email: "jane@example.com",
  serviceInterest: "seo",
  budget: "1k-5k",
  message: "Hello, I need help with my site.",
  consent: true,
};

describe("contactFormSchema", () => {
  test("accepts a valid submission unchanged", () => {
    const result = contactFormSchema.safeParse(valid);
    assert.equal(result.success, true);
    assert.deepEqual(result.data, valid);
  });

  test("accepts a message of exactly 5000 characters", () => {
    const result = contactFormSchema.safeParse({
      ...valid,
      message: "x".repeat(5000),
    });
    assert.equal(result.success, true);
  });

  test("rejects a 5001-character message on the message field with the 5000 cap", () => {
    const result = contactFormSchema.safeParse({
      ...valid,
      message: "x".repeat(5001),
    });
    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0]?.path, ["message"]);
    assert.equal(result.error?.issues[0]?.code, "too_big");
    // Pins the cap to the WordPress plugin's constant.
    assert.equal(
      (result.error?.issues[0] as { maximum?: number }).maximum,
      5000,
    );
  });

  test("still enforces min(10), and whitespace-only trims to too_small, never too_big", () => {
    const short = contactFormSchema.safeParse({ ...valid, message: "short" });
    assert.equal(short.success, false);
    assert.equal(short.error?.issues[0]?.code, "too_small");

    const spaces = contactFormSchema.safeParse({
      ...valid,
      message: " ".repeat(5000),
    });
    assert.equal(spaces.success, false);
    assert.equal(spaces.error?.issues[0]?.code, "too_small");
  });

  test("applies the cap to the trimmed value, matching what WordPress receives", () => {
    // Raw length 5012, trimmed length 12 — must pass.
    const result = contactFormSchema.safeParse({
      ...valid,
      message: " ".repeat(5000) + "hello there!",
    });
    assert.equal(result.success, true);
    assert.equal(result.data?.message, "hello there!");
  });

  test("caps no other field — the audit scopes .max() to message only", () => {
    const result = contactFormSchema.safeParse({
      ...valid,
      name: "x".repeat(6000),
    });
    assert.equal(result.success, true);
  });

  test("honeypot website field stays optional and deliberately permissive", () => {
    assert.equal(contactFormSchema.safeParse(valid).success, true);
    assert.equal(
      contactFormSchema.safeParse({ ...valid, website: "" }).success,
      true,
    );
    // Schema-permissive on purpose (audit FORM-2) — enforcement is
    // server-side in contact.service.ts via isHoneypotFilled().
    assert.equal(
      contactFormSchema.safeParse({ ...valid, website: "https://spam.example" })
        .success,
      true,
    );
  });
});
