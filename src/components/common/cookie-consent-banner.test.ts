import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// CLIENT-5: the cookie-notice banner is a client component (framer-motion-
// adjacent JSX), which this repo's `node --test` runner cannot render — see
// src/app/privacy-policy/privacy-policy.test.ts for the established
// source-contract convention used for the same reason. The banner's actual
// show/hide/storage *behaviour* is covered without JSX in
// src/lib/consent/cookie-consent.test.ts; this file pins the contract
// between the two (which storage helpers it calls, what it renders) plus
// accessibility and layout-safety properties visible in the source.

const BANNER = readFileSync(
  new URL("./CookieConsentBanner.tsx", import.meta.url),
  "utf8",
);
const LAYOUT = readFileSync(
  new URL("../../app/layout.tsx", import.meta.url),
  "utf8",
);

describe("cookie consent banner wiring (CLIENT-5)", () => {
  test("is mounted once, sitewide, in the root layout", () => {
    assert.match(
      LAYOUT,
      /import \{ CookieConsentBanner \} from "@\/components\/common\/CookieConsentBanner";/,
    );
    assert.match(LAYOUT, /<CookieConsentBanner \/>/);
    const occurrences = LAYOUT.match(/<CookieConsentBanner \/>/g) ?? [];
    assert.equal(occurrences.length, 1);
  });

  test("uses the shared consent storage helpers, not its own ad-hoc storage", () => {
    assert.match(BANNER, /import \{\s*getCookieConsent,\s*setCookieConsent,/);
    assert.doesNotMatch(BANNER, /localStorage\.(get|set)Item/);
  });

  test("reads the stored decision before ever rendering, to avoid a flash or duplicate banner", () => {
    assert.match(
      BANNER,
      /useEffect\(\(\) => \{[\s\S]*?setDecision\(getCookieConsent\(\)\);/,
    );
    assert.match(
      BANNER,
      /if \(decision === undefined \|\| decision !== null\) return null;/,
    );
  });
});

describe("cookie consent banner content and controls (CLIENT-5)", () => {
  test("provides both an accept and a reject control", () => {
    assert.match(BANNER, />\s*Accept\s*</);
    assert.match(BANNER, />\s*Reject\s*</);
    assert.match(BANNER, /decide\("accepted"\)/);
    assert.match(BANNER, /decide\("rejected"\)/);
  });

  test("both controls are real buttons with visible accessible names, not bare divs", () => {
    const buttonMatches = BANNER.match(/<button\s/g) ?? [];
    assert.ok(buttonMatches.length >= 2);
    assert.doesNotMatch(BANNER, /role="button"/);
  });

  test("links to the real Cookie Policy route, not a hardcoded path", () => {
    assert.match(BANNER, /href=\{ROUTES\.cookiePolicy\}/);
  });

  test("is an accessible landmark region rather than an unlabeled div", () => {
    assert.match(BANNER, /role="region"/);
    assert.match(BANNER, /aria-label="Cookie notice"/);
  });

  test("does not claim or introduce any tracking/analytics script", () => {
    assert.doesNotMatch(BANNER, /gtag|GoogleAnalytics|GTM|fbq|hotjar|clarity/i);
  });

  test("does not build a fake multi-category consent manager for cookies that don't exist", () => {
    assert.doesNotMatch(BANNER, /type="checkbox"/);
    assert.doesNotMatch(
      BANNER,
      /manage preferences|customi[sz]e (cookies|preferences)/i,
    );
  });
});
