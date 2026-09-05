import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// CLIENT-5: pins that the Cookie Policy page keeps real TFF Digital content,
// is wired into SEO the same way every other public legal page is, stays
// linked from the footer, and only describes cookie/storage technologies
// this repository actually ships (see the CLIENT-5 audit: no analytics, no
// advertising, no third-party tracking scripts). Source-level, matching the
// existing convention for static-copy legal pages (privacy-policy.test.ts,
// terms-and-conditions.test.ts).

const PAGE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const BODY = readFileSync(
  new URL("../../sections/legal/CookiePolicyBody.tsx", import.meta.url),
  "utf8",
);
const FOOTER = readFileSync(
  new URL("../../components/layout/Footer.tsx", import.meta.url),
  "utf8",
);
const ROUTES = readFileSync(
  new URL("../../constants/routes.ts", import.meta.url),
  "utf8",
);

const PLACEHOLDER_MARKERS = [
  /lorem ipsum/i,
  /\[company( name)?\]/i,
  /your company/i,
  /acme( inc)?/i,
  /example\.com/i,
  /john ?doe/i,
  /placeholder/i,
];

describe("cookie policy route (CLIENT-5)", () => {
  test("ROUTES.cookiePolicy is defined once, not hardcoded elsewhere", () => {
    assert.match(ROUTES, /cookiePolicy:\s*"\/cookie-policy"/);
  });
});

describe("cookie policy page metadata (CLIENT-5)", () => {
  test("sets a real title, description, canonical and OpenGraph via the shared SEO helpers", () => {
    assert.match(PAGE, /title:\s*"Cookie Policy"/);
    assert.match(
      PAGE,
      /alternates:\s*\{\s*canonical:\s*getCanonicalUrl\(ROUTES\.cookiePolicy\)/,
    );
    assert.match(
      PAGE,
      /openGraph:\s*buildPageOpenGraph\(getCanonicalUrl\(ROUTES\.cookiePolicy\)\)/,
    );
  });

  test("does not opt itself out of indexing", () => {
    assert.doesNotMatch(PAGE, /robots\s*:/);
    assert.doesNotMatch(PAGE, /noindex/i);
  });

  test("does not introduce a second metadata or hero system", () => {
    assert.doesNotMatch(PAGE, /<Head>|react-helmet|next\/head/);
    assert.match(PAGE, /<LegalHero/);
  });
});

describe("cookie policy content (CLIENT-5)", () => {
  test("contains no placeholder or template boilerplate", () => {
    for (const marker of PLACEHOLDER_MARKERS) {
      assert.doesNotMatch(BODY, marker);
    }
  });

  test("names TFF Digital and the real contact channel, not a stand-in business", () => {
    assert.match(BODY, /TFF Digital/);
    assert.match(BODY, /mailto:info@tffdigital\.com/);
    assert.match(BODY, /Zirakpur, Punjab, India/);
  });

  test("covers the core sections a usable cookie policy needs", () => {
    for (const heading of [
      "Introduction",
      "What Cookies Are",
      "How TFF Digital Uses Cookies",
      "Types of Cookies We Use",
      "Third-Party Cookies",
      "Cookie Duration",
      "How You Can Manage Cookies",
      "Browser and Device Controls",
      "Changes to This Cookie Policy",
      "Contact Us",
    ]) {
      assert.match(BODY, new RegExp(heading));
    }
  });

  test("does not claim analytics or advertising cookies that don't exist", () => {
    assert.match(BODY, /do not currently use analytics cookies/i);
    assert.match(BODY, /do not currently use marketing, advertising/i);
  });

  test("names the real storage key used by the consent banner", () => {
    assert.match(BODY, /tff-cookie-consent/);
  });
});

describe("footer links to the cookie policy (CLIENT-5)", () => {
  test("Footer links to ROUTES.cookiePolicy, not a hardcoded path", () => {
    assert.match(FOOTER, /href=\{ROUTES\.cookiePolicy\}/);
    assert.match(FOOTER, /Cookie Policy/);
  });
});
