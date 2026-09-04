import assert from "node:assert/strict";
import test, { describe } from "node:test";

import {
  BrainCircuit,
  CodeXml,
  Megaphone,
  Palette,
  Search,
  Share2,
  Sparkles,
  Video,
  Workflow,
} from "lucide-react";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import { getServiceIcon } from "./service-icons.ts";

// PARITY-1: every service slug currently published in WordPress must resolve
// to a dedicated icon, never the generic Sparkles fallback.
describe("getServiceIcon — live WordPress slugs (PARITY-1)", () => {
  const liveWordPressSlugs = {
    "ai-consulting": BrainCircuit,
    "ai-automation": Workflow,
    "digital-marketing": Megaphone,
    "wordpress-development": CodeXml,
    "seo-optimization": Search,
    "ui-ux-design": Palette,
    "web-development": CodeXml,
  } as const;

  for (const [slug, expectedIcon] of Object.entries(liveWordPressSlugs)) {
    test(`maps "${slug}" to its intended icon`, () => {
      assert.equal(getServiceIcon(slug), expectedIcon);
      assert.notEqual(getServiceIcon(slug), Sparkles);
    });
  }
});

describe("getServiceIcon — pre-existing mappings preserved", () => {
  test("legacy slugs used by the hardcoded services grid keep their icons", () => {
    assert.equal(getServiceIcon("seo"), Search);
    assert.equal(getServiceIcon("smm"), Share2);
    assert.equal(getServiceIcon("google-meta-ads"), Megaphone);
    assert.equal(getServiceIcon("video-editing"), Video);
  });
});

describe("getServiceIcon — unknown slugs", () => {
  test("falls back to the generic Sparkles icon", () => {
    assert.equal(getServiceIcon("some-future-service"), Sparkles);
    assert.equal(getServiceIcon(""), Sparkles);
  });

  test("prototype-chain keys fall back instead of leaking Object members", () => {
    assert.equal(getServiceIcon("constructor"), Sparkles);
    assert.equal(getServiceIcon("__proto__"), Sparkles);
    assert.equal(getServiceIcon("hasOwnProperty"), Sparkles);
  });
});
