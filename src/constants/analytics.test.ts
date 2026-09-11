import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";
import { readdirSync } from "node:fs";
import path from "node:path";
import { GTM_CONTAINER_ID } from "./analytics.ts";

// Pins the client-provided Google Tag Manager install (GTM-KTSN4NHB): the
// exact container ID, that it's wired centrally through the root layout
// rather than any individual page, and that the CSP allows the host it
// needs. Source-contract style, matching this repo's convention for
// JSX-bearing files node --test can't render (see
// src/components/common/cookie-consent-banner.test.ts).

const LAYOUT = readFileSync(
  new URL("../app/layout.tsx", import.meta.url),
  "utf8",
);
const NEXT_CONFIG = readFileSync(
  new URL("../../next.config.ts", import.meta.url),
  "utf8",
);

describe("GTM container ID", () => {
  test("matches the exact client-provided container, not a placeholder", () => {
    assert.equal(GTM_CONTAINER_ID, "GTM-KTSN4NHB");
  });
});

describe("GTM wiring in the root layout (src/app/layout.tsx)", () => {
  // next/script's strategy="beforeInteractive" only guarantees the script
  // *executes* before hydration — in App Router it injects via Next's own
  // side-channel immediately after <body> opens, regardless of where the
  // <Script> component sits in the tree (verified against actual rendered
  // HTML from `next build` + `next start`, not just this source file). A
  // plain <script> authored directly inside a literal <head> element is
  // what actually lands in <head>, so this must NOT use next/script.
  test("does not use next/script (its beforeInteractive strategy renders in body, not head)", () => {
    assert.doesNotMatch(LAYOUT, /from "next\/script"/);
    assert.doesNotMatch(LAYOUT, /strategy="beforeInteractive"/);
  });

  test("the root layout renders a literal <head> element ahead of <body>", () => {
    const headIdx = LAYOUT.indexOf("<head>");
    const headCloseIdx = LAYOUT.indexOf("</head>");
    const bodyTagIdx = LAYOUT.indexOf("<body", headCloseIdx);
    assert.notEqual(headIdx, -1);
    assert.notEqual(headCloseIdx, -1);
    assert.notEqual(bodyTagIdx, -1);
    assert.ok(headIdx < headCloseIdx, "<head> must open before it closes");
    assert.ok(headCloseIdx < bodyTagIdx, "</head> must close before <body> opens");
  });

  test("the GTM bootstrap <script> is inside <head>...</head>, not <body>", () => {
    const headIdx = LAYOUT.indexOf("<head>");
    const headCloseIdx = LAYOUT.indexOf("</head>");
    const bootstrapIdx = LAYOUT.indexOf('id="gtm-bootstrap"');
    assert.notEqual(bootstrapIdx, -1);
    assert.ok(
      headIdx < bootstrapIdx && bootstrapIdx < headCloseIdx,
      "gtm-bootstrap script must sit between <head> and </head>",
    );
  });

  test("the Consent Mode default is a separate <script> inside <head>, before gtm-bootstrap", () => {
    const headIdx = LAYOUT.indexOf("<head>");
    const headCloseIdx = LAYOUT.indexOf("</head>");
    const consentDefaultIdx = LAYOUT.indexOf('id="consent-default"');
    const bootstrapIdx = LAYOUT.indexOf('id="gtm-bootstrap"');
    assert.notEqual(consentDefaultIdx, -1);
    assert.ok(
      headIdx < consentDefaultIdx && consentDefaultIdx < headCloseIdx,
      "consent-default script must sit between <head> and </head>",
    );
    assert.ok(
      consentDefaultIdx < bootstrapIdx,
      "Consent Mode default must be pushed to dataLayer before the GTM bootstrap script runs",
    );
  });

  test("the Consent Mode default denies analytics_storage and every ad_* signal", () => {
    const consentScript = LAYOUT.match(
      /id="consent-default"[\s\S]*?__html:\s*`([^`]*)`/,
    )?.[1];
    assert.ok(consentScript, "consent-default script content not found");
    assert.match(consentScript!, /gtag\('consent','default',/);
    assert.match(consentScript!, /ad_storage:'denied'/);
    assert.match(consentScript!, /ad_user_data:'denied'/);
    assert.match(consentScript!, /ad_personalization:'denied'/);
    assert.match(consentScript!, /analytics_storage:'denied'/);
  });

  test("the bootstrap script resolves to the real gtm.js request for this container", () => {
    assert.match(
      LAYOUT,
      /'https:\/\/www\.googletagmanager\.com\/gtm\.js\?id='\+i\+dl/,
    );
    assert.match(LAYOUT, /'script','dataLayer','\$\{GTM_CONTAINER_ID\}'\)/);
  });

  test("renders the noscript iframe fallback pointing at ns.html for this container", () => {
    assert.match(
      LAYOUT,
      /<noscript>\s*<iframe\s+src=\{`https:\/\/www\.googletagmanager\.com\/ns\.html\?id=\$\{GTM_CONTAINER_ID\}`\}/,
    );
  });

  test("the noscript iframe is the first thing rendered inside <body>", () => {
    const headCloseIdx = LAYOUT.indexOf("</head>");
    const bodyTagIdx = LAYOUT.indexOf("<body", headCloseIdx);
    const bodyOpenEnd = LAYOUT.indexOf(">", bodyTagIdx) + 1;
    const afterBody = LAYOUT.slice(bodyOpenEnd).trimStart();
    // The only thing allowed between <body ...> and <noscript> is JSX
    // whitespace/comments — no other element may render before it.
    const strippedComments = afterBody.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").trimStart();
    assert.ok(
      strippedComments.startsWith("<noscript>"),
      "noscript must be the first rendered element inside <body>",
    );
  });

  test("the noscript iframe stays invisible and out of the tab order", () => {
    const iframeBlock = LAYOUT.match(/<iframe[\s\S]*?\/>/)?.[0] ?? "";
    assert.match(iframeBlock, /height="0"/);
    assert.match(iframeBlock, /width="0"/);
    assert.match(iframeBlock, /display:\s*"none"/);
    assert.match(iframeBlock, /title="Google Tag Manager"/);
  });

  test("GTM is installed exactly once, in the root layout only", () => {
    const occurrences = LAYOUT.match(/googletagmanager\.com/g) ?? [];
    // gtm.js + ns.html = 2 references, both inside this one file.
    assert.equal(occurrences.length, 2);
  });
});

describe("GTM is not duplicated on individual pages/layouts", () => {
  test("no other page.tsx or layout.tsx under src/app references googletagmanager.com", () => {
    const appDir = path.join(path.dirname(new URL(import.meta.url).pathname), "..", "app");
    const offenders: string[] = [];

    const walk = (dir: string, relDir: string) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "layout.tsx" && relDir === ".") continue; // root layout, checked above
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(entryPath, path.join(relDir, entry.name));
          continue;
        }
        if (entry.name === "page.tsx" || entry.name === "layout.tsx") {
          const contents = readFileSync(entryPath, "utf8");
          if (contents.includes("googletagmanager.com")) {
            offenders.push(path.join(relDir, entry.name));
          }
        }
      }
    };

    walk(appDir, ".");
    assert.deepEqual(offenders, []);
  });
});

describe("CSP allows the GTM host it actually needs (next.config.ts)", () => {
  test("gtmOrigin resolves to the real Google Tag Manager host", () => {
    assert.match(
      NEXT_CONFIG,
      /const gtmOrigin = "https:\/\/www\.googletagmanager\.com";/,
    );
  });

  test("script-src allows gtmOrigin, for the gtm.js bootstrap request", () => {
    const scriptSrcLine = NEXT_CONFIG.match(/`script-src[^`]*`/)?.[0] ?? "";
    assert.match(scriptSrcLine, /\$\{gtmOrigin\}/);
  });

  test("frame-src allows gtmOrigin, for the noscript ns.html iframe", () => {
    const frameSrcLine = NEXT_CONFIG.match(/`frame-src[^`]*`/)?.[0] ?? "";
    assert.match(frameSrcLine, /\$\{gtmOrigin\}/);
  });

  test("does not weaken CSP with a wildcard Google domain", () => {
    assert.doesNotMatch(NEXT_CONFIG, /\*\.google\.com/);
    assert.doesNotMatch(NEXT_CONFIG, /script-src[^`]*'\*'/);
  });
});
