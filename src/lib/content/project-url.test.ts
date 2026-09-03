import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import { isSafeProjectUrl } from "./project-url.ts";

describe("isSafeProjectUrl", () => {
  test("accepts ordinary http and https project URLs", () => {
    assert.equal(isSafeProjectUrl("https://chicabebo.com"), true);
    assert.equal(isSafeProjectUrl("http://example.com"), true);
    assert.equal(
      isSafeProjectUrl("https://example.com/work/case?ref=tff#top"),
      true,
    );
    // Uppercase scheme: URL normalizes protocol to lowercase before we look.
    assert.equal(isSafeProjectUrl("HTTPS://example.com"), true);
  });

  test("rejects the javascript: scheme SEC3-1 is about", () => {
    assert.equal(isSafeProjectUrl("javascript:alert(document.domain)"), false);
    // Whitespace/case variants browsers still honour in an href.
    assert.equal(isSafeProjectUrl("JavaScript:alert(1)"), false);
    assert.equal(isSafeProjectUrl("  javascript:alert(1)"), false);
  });

  test("rejects every other non-http(s) scheme", () => {
    assert.equal(
      isSafeProjectUrl("data:text/html,<script>alert(1)</script>"),
      false,
    );
    assert.equal(isSafeProjectUrl("file:///etc/passwd"), false);
    assert.equal(isSafeProjectUrl("vbscript:msgbox(1)"), false);
    assert.equal(isSafeProjectUrl("mailto:info@tffdigital.com"), false);
    assert.equal(isSafeProjectUrl("ftp://example.com"), false);
  });

  test("rejects empty and non-absolute values", () => {
    assert.equal(isSafeProjectUrl(null), false);
    assert.equal(isSafeProjectUrl(undefined), false);
    assert.equal(isSafeProjectUrl(""), false);
    assert.equal(isSafeProjectUrl("   "), false);
    assert.equal(isSafeProjectUrl("example.com"), false);
    assert.equal(isSafeProjectUrl("/case-studies/chicabebo"), false);
  });
});
