import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// CLIENT-3: pins that the Privacy Policy page keeps real TFF Digital content,
// is wired into SEO the same way every other public page is, and stays
// linked from the footer. This is source-level (like service-routes.test.ts)
// rather than a render test, matching this repo's existing convention for
// static-copy pages.

const PAGE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const BODY = readFileSync(
  new URL("../../sections/legal/PrivacyPolicyBody.tsx", import.meta.url),
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

describe("privacy policy page metadata (CLIENT-3)", () => {
  test("sets a real title, description, canonical and OpenGraph via the shared SEO helpers", () => {
    assert.match(PAGE, /title:\s*"Privacy Policy"/);
    assert.match(
      PAGE,
      /alternates:\s*\{\s*canonical:\s*getCanonicalUrl\(ROUTES\.privacyPolicy\)/,
    );
    assert.match(
      PAGE,
      /openGraph:\s*buildPageOpenGraph\(getCanonicalUrl\(ROUTES\.privacyPolicy\)\)/,
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

describe("privacy policy content (CLIENT-3)", () => {
  test("contains no placeholder or template boilerplate", () => {
    for (const marker of PLACEHOLDER_MARKERS) {
      assert.doesNotMatch(BODY, marker);
    }
  });

  test("names TFF Digital and the real contact channel, not a stand-in business", () => {
    assert.match(BODY, /TFF Digital/);
    assert.match(BODY, /mailto:info@tffdigital\.com/);
  });

  test("covers the core sections a usable privacy policy needs", () => {
    for (const heading of [
      "Information We Collect",
      "How We Use Information",
      "Cookies and Similar Technologies",
      "Data Retention",
      "Data Security",
      "Your Privacy Rights",
      "Contact Us",
    ]) {
      assert.match(BODY, new RegExp(heading));
    }
  });

  test("only claims the analytics/advertising tooling the site actually has (none, beyond GTM)", () => {
    // The site loads Google Tag Manager (GTM-KTSN4NHB, see
    // src/app/layout.tsx) but has no analytics or advertising tags
    // configured through it, so the copy must disclose GTM while still
    // saying it doesn't use analytics/advertising tools, rather than
    // claiming no tracking infrastructure exists at all.
    assert.match(
      BODY,
      /do not (currently )?use (third-party )?(cookies|analytics)/i,
    );
    assert.match(BODY, /Google Tag Manager/);
  });
});

describe("footer links to the privacy policy (CLIENT-3)", () => {
  test("Footer links to ROUTES.privacyPolicy, not a hardcoded path", () => {
    assert.match(FOOTER, /href=\{ROUTES\.privacyPolicy\}/);
  });
});
