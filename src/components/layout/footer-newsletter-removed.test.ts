import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// FORM-3: the footer newsletter signup (and its /blog counterpart,
// NewsletterSection) was 100% fake — no WordPress newsletter CPT/endpoint,
// no third-party provider, no API route or Server Action ever existed. It
// showed a hardcoded "You're subscribed" success message without ever
// sending the entered email anywhere, while the Privacy Policy separately
// claimed the site collects and uses newsletter emails. Removed rather than
// wired to a provider — no approved backend exists, and this repo must not
// invent one. Pins the removal so it can't silently come back.

const FOOTER = readFileSync(new URL("./Footer.tsx", import.meta.url), "utf8");

describe("footer newsletter signup removed (FORM-3)", () => {
  test("Footer no longer renders a subscribe form or fake success state", () => {
    assert.doesNotMatch(FOOTER, /Subscribe/);
    assert.doesNotMatch(FOOTER, /subscribed/i);
    assert.doesNotMatch(FOOTER, /footer-newsletter-email/);
  });

  test("Footer has no client-only state left, so it isn't a client component", () => {
    assert.doesNotMatch(FOOTER, /^"use client";/);
    assert.doesNotMatch(FOOTER, /useState/);
  });
});
