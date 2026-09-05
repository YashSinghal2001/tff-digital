import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// Route-shape guard for the six WordPress services (ARCH-1 residual): the
// dynamic [slug] route is the only handler under /services/<slug>. A static
// segment beats a dynamic one in the App Router, so re-adding a bespoke
// src/app/services/smm (or /seo) page would silently shadow the CMS entry —
// exactly the collision this removes.
const APP_SERVICES = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(APP_SERVICES, "../..");

const CANONICAL_SERVICE_SLUGS = [
  "aeo-seo",
  "smm",
  "meta-ads",
  "web-development",
  "video-editing",
  "zoho-one",
];

describe("service routes", () => {
  test("only the dynamic [slug] route serves a service URL", () => {
    assert.ok(existsSync(path.join(APP_SERVICES, "[slug]", "page.tsx")));
    for (const slug of [...CANONICAL_SERVICE_SLUGS, "seo"]) {
      assert.ok(
        !existsSync(path.join(APP_SERVICES, slug)),
        `src/app/services/${slug} would shadow the WordPress-driven route`,
      );
    }
  });

  test("marketing copy states the six-service count", () => {
    const sources = [
      "sections/services/ServicesHero.tsx",
      "sections/home/WhatWeDo.tsx",
      "app/services/page.tsx",
    ].map((file) => readFileSync(path.join(SRC, file), "utf8"));
    for (const source of sources) {
      assert.doesNotMatch(source, /Nine disciplines|Sixteen disciplines/);
      assert.match(source, /Six disciplines/);
    }
  });
});
