import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import { isHoneypotFilled } from "./honeypot.ts";

describe("isHoneypotFilled", () => {
  test("treats a filled honeypot as spam", () => {
    assert.equal(isHoneypotFilled("https://buy-cheap-links.example"), true);
    assert.equal(isHoneypotFilled("anything"), true);
  });

  test("ignores whitespace-only values a bot might submit", () => {
    assert.equal(isHoneypotFilled(" "), false);
    assert.equal(isHoneypotFilled("\n\t "), false);
  });

  test("lets ordinary submissions through", () => {
    // What a real visitor's untouched field sends: react-hook-form registers
    // the input and submits an empty string; the Zod field is also optional,
    // so a client that omits it entirely must be treated the same way.
    assert.equal(isHoneypotFilled(""), false);
    assert.equal(isHoneypotFilled(undefined), false);
    assert.equal(isHoneypotFilled(null), false);
  });
});
