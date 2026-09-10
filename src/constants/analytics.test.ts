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
  test("loads the bootstrap script via next/script with strategy beforeInteractive", () => {
    assert.match(LAYOUT, /import Script from "next\/script";/);
    assert.match(LAYOUT, /<Script[\s\S]*?strategy="beforeInteractive"/);
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
