import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// CLIENT-7: the homepage hero's auto-rotating founder photo (HeroShowcase)
// sits directly beside the H1 in the initial viewport and is a strong LCP
// candidate, but it rendered with next/image's default lazy behaviour — no
// priority, no preload link — same pattern this codebase already avoids for
// PostCard/CaseStudyCard's index===0 images. JSX can't run under this repo's
// `node --test` runner, so this pins the fix by reading the source, the same
// technique PERF-1's test uses.
const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const HERO_SHOWCASE = readFileSync(path.join(SRC, "sections/home/HeroShowcase.tsx"), "utf8");

describe("homepage hero image is prioritized for LCP (CLIENT-7)", () => {
  test("the first slide's Image carries priority", () => {
    assert.match(HERO_SHOWCASE, /priority=\{index === 0\}/);
  });
});
