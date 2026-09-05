import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe } from "node:test";
import { JSDOM } from "jsdom";

// CLIENT-5: the cookie-notice banner's storage layer. Plain DOM (no React),
// exercised with jsdom the same way src/lib/a11y/focus-trap.ts is.

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://www.tffdigital.com/",
});
Object.assign(globalThis, { window: dom.window });

const { COOKIE_CONSENT_STORAGE_KEY, getCookieConsent, setCookieConsent } =
  await import("./cookie-consent.ts");

describe("cookie consent storage (CLIENT-5)", () => {
  beforeEach(() => {
    dom.window.localStorage.clear();
  });

  test("returns null when no decision has been stored", () => {
    assert.equal(getCookieConsent(), null);
  });

  test("stores and reads back an accepted decision", () => {
    setCookieConsent("accepted");
    assert.equal(getCookieConsent(), "accepted");
    assert.equal(
      dom.window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY),
      "accepted",
    );
  });

  test("stores and reads back a rejected decision", () => {
    setCookieConsent("rejected");
    assert.equal(getCookieConsent(), "rejected");
  });

  test("ignores a corrupted/unexpected stored value instead of throwing", () => {
    dom.window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, "yes-please");
    assert.equal(getCookieConsent(), null);
  });

  describe("when storage throws", () => {
    let originalGetItem: typeof dom.window.localStorage.getItem;
    let originalSetItem: typeof dom.window.localStorage.setItem;

    beforeEach(() => {
      originalGetItem = dom.window.localStorage.getItem.bind(
        dom.window.localStorage,
      );
      originalSetItem = dom.window.localStorage.setItem.bind(
        dom.window.localStorage,
      );
      dom.window.localStorage.getItem = () => {
        throw new Error("storage disabled");
      };
      dom.window.localStorage.setItem = () => {
        throw new Error("storage disabled");
      };
    });

    afterEach(() => {
      dom.window.localStorage.getItem = originalGetItem;
      dom.window.localStorage.setItem = originalSetItem;
    });

    test("getCookieConsent fails safe to null instead of crashing", () => {
      assert.doesNotThrow(() => getCookieConsent());
      assert.equal(getCookieConsent(), null);
    });

    test("setCookieConsent fails silently instead of crashing", () => {
      assert.doesNotThrow(() => setCookieConsent("accepted"));
    });
  });
});
