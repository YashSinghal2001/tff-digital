import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// CLIENT-4: pins that the Terms & Conditions page keeps real TFF Digital
// content, is wired into SEO the same way every other public page is, stays
// linked from the footer, and doesn't claim site functionality (payments,
// accounts, ecommerce) that doesn't exist. Source-level, matching this
// repo's existing convention for static-copy legal pages (see
// privacy-policy.test.ts).

const PAGE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const BODY = readFileSync(
  new URL("../../sections/legal/TermsBody.tsx", import.meta.url),
  "utf8",
);
const FOOTER = readFileSync(
  new URL("../../components/layout/Footer.tsx", import.meta.url),
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

describe("terms & conditions page metadata (CLIENT-4)", () => {
  test("sets a real title, description, canonical and OpenGraph via the shared SEO helpers", () => {
    assert.match(PAGE, /title:\s*"Terms & Conditions"/);
    assert.match(
      PAGE,
      /alternates:\s*\{\s*canonical:\s*getCanonicalUrl\(ROUTES\.termsAndConditions\)/,
    );
    assert.match(
      PAGE,
      /openGraph:\s*buildPageOpenGraph\(getCanonicalUrl\(ROUTES\.termsAndConditions\)\)/,
    );
  });

  test("does not opt itself out of indexing", () => {
    // No robots override here means the page inherits the sitewide
    // index/follow default (src/lib/seo/robots.ts) — this pins that nobody
    // accidentally adds a noindex to a page the client wants discoverable.
    assert.doesNotMatch(PAGE, /robots\s*:/);
    assert.doesNotMatch(PAGE, /noindex/i);
  });

  test("does not introduce a second metadata system", () => {
    assert.doesNotMatch(PAGE, /<Head>|react-helmet|next\/head/);
  });
});

describe("terms & conditions content (CLIENT-4)", () => {
  test("contains no placeholder or template boilerplate", () => {
    for (const marker of PLACEHOLDER_MARKERS) {
      assert.doesNotMatch(BODY, marker);
    }
  });

  test("names TFF Digital and the real contact channel, not a stand-in business", () => {
    assert.match(BODY, /TFF Digital/);
    assert.match(BODY, /mailto:info@tffdigital\.com/);
  });

  test("covers the core sections a usable terms page needs", () => {
    for (const heading of [
      "Introduction / Acceptance of Terms",
      "Use of Website",
      "Services",
      "User Responsibilities",
      "Intellectual Property",
      "Third-Party Links",
      "Disclaimer",
      "Limitation of Liability",
      "Changes to These Terms",
      "Governing Law",
      "Contact Information",
    ]) {
      assert.match(BODY, new RegExp(heading));
    }
  });

  test("does not claim site functionality that doesn't exist (payments, accounts, ecommerce)", () => {
    assert.doesNotMatch(BODY, /refund|checkout|credit card|log ?in|sign ?up for an account|subscription fee/i);
  });
});

describe("footer links to the terms & conditions page (CLIENT-4)", () => {
  test("Footer links to ROUTES.termsAndConditions, not a hardcoded path", () => {
    assert.match(FOOTER, /href=\{ROUTES\.termsAndConditions\}/);
  });
});
