import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// UX/A11Y polish audit: name/email/phone/company are common personal-data
// fields (WCAG 2.1 SC 1.3.5, Identify Input Purpose) — a browser/AT can only
// reliably identify their purpose and offer autofill when the input carries
// the matching `autocomplete` token, which `type="email"`/`type="tel"` alone
// don't provide.

const SOURCE = readFileSync(
  new URL("./ContactForm.tsx", import.meta.url),
  "utf8",
);

describe("ContactForm autocomplete tokens", () => {
  test("name field is autoComplete=\"name\"", () => {
    assert.match(SOURCE, /label="Name\*"[\s\S]{0,120}autoComplete="name"/);
  });

  test("email field is autoComplete=\"email\"", () => {
    assert.match(SOURCE, /label="Work email\*"[\s\S]{0,150}autoComplete="email"/);
  });

  test("phone field is autoComplete=\"tel\"", () => {
    assert.match(SOURCE, /label="Phone"[\s\S]{0,150}autoComplete="tel"/);
  });

  test("company field is autoComplete=\"organization\"", () => {
    assert.match(SOURCE, /label="Company"[\s\S]{0,120}autoComplete="organization"/);
  });
});
