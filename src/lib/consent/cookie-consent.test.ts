import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe } from "node:test";
import { JSDOM } from "jsdom";

// CLIENT-5: the cookie-notice banner's storage layer. Plain DOM (no React),
// exercised with jsdom the same way src/lib/a11y/focus-trap.ts is.

const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://www.tffdigital.com/",
});
Object.assign(globalThis, { window: dom.window });

const {
  COOKIE_CONSENT_STORAGE_KEY,
  getCookieConsent,
  setCookieConsent,
  updateConsentMode,
  restoreConsentMode,
} = await import("./cookie-consent.ts");

function lastConsentPush(): unknown[] | undefined {
  const dataLayer = dom.window.dataLayer as unknown[][] | undefined;
  return dataLayer?.[dataLayer.length - 1];
}

describe("cookie consent storage (CLIENT-5)", () => {
  beforeEach(() => {
    dom.window.localStorage.clear();
    dom.window.dataLayer = [];
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

describe("Google Consent Mode wiring", () => {
  beforeEach(() => {
    dom.window.localStorage.clear();
    dom.window.dataLayer = [];
  });

  test("updateConsentMode grants analytics_storage on 'accepted'", () => {
    updateConsentMode("accepted");
    const push = lastConsentPush();
    assert.deepEqual(push, [
      "consent",
      "update",
      { analytics_storage: "granted" },
    ]);
  });

  test("updateConsentMode keeps analytics_storage denied on 'rejected'", () => {
    updateConsentMode("rejected");
    const push = lastConsentPush();
    assert.deepEqual(push, [
      "consent",
      "update",
      { analytics_storage: "denied" },
    ]);
  });

  test("updateConsentMode never touches ad_storage/ad_user_data/ad_personalization (no ad tags run here)", () => {
    updateConsentMode("accepted");
    const push = lastConsentPush() as [string, string, Record<string, string>];
    assert.deepEqual(Object.keys(push[2]), ["analytics_storage"]);
  });

  test("setCookieConsent also pushes the matching Consent Mode update (first-time Accept)", () => {
    setCookieConsent("accepted");
    assert.deepEqual(lastConsentPush(), [
      "consent",
      "update",
      { analytics_storage: "granted" },
    ]);
  });

  test("setCookieConsent also pushes the matching Consent Mode update (first-time Reject)", () => {
    setCookieConsent("rejected");
    assert.deepEqual(lastConsentPush(), [
      "consent",
      "update",
      { analytics_storage: "denied" },
    ]);
  });

  test("restoreConsentMode is a no-op for a first-time visitor (nothing stored)", () => {
    restoreConsentMode();
    assert.deepEqual(dom.window.dataLayer, []);
  });

  test("restoreConsentMode grants analytics for a returning visitor who previously accepted", () => {
    setCookieConsent("accepted");
    dom.window.dataLayer = []; // clear the push from setCookieConsent above
    restoreConsentMode();
    assert.deepEqual(lastConsentPush(), [
      "consent",
      "update",
      { analytics_storage: "granted" },
    ]);
  });

  test("restoreConsentMode keeps analytics denied for a returning visitor who previously rejected", () => {
    setCookieConsent("rejected");
    dom.window.dataLayer = [];
    restoreConsentMode();
    assert.deepEqual(lastConsentPush(), [
      "consent",
      "update",
      { analytics_storage: "denied" },
    ]);
  });
});
