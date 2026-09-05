import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// A11Y-5, codebase-wide guard. framer-motion's MotionConfig covers the JS
// animations, but CSS-driven movement is invisible to it: a Tailwind class
// that moves an element on hover, or a keyframe loader, keeps animating for
// a reduced-motion user unless the call site says otherwise. This walks the
// real source tree so a NEW component that adds movement without a
// `motion-reduce:` counterpart fails the suite instead of shipping.

const SRC = join(fileURLToPath(new URL("../../", import.meta.url)));

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return tsxFiles(path);
    return entry.isFile() && path.endsWith(".tsx") ? [path] : [];
  });
}

/**
 * Class lists live in double-quoted single-line strings (including each
 * argument of a multi-line `cn(...)` call), so the enclosing literal is the
 * unit a `motion-reduce:` counterpart has to appear in.
 */
function stringLiterals(source: string): string[] {
  return source.match(/"(?:[^"\\\n]|\\.)*"/g) ?? [];
}

/** Utilities that move an element: the vestibular trigger PRM is about. */
const MOVEMENT =
  /(?:^|[\s"])(?:group-)?hover:-?(?:translate|scale|rotate|skew)-/;
/** Keyframe loops (animate-spin / animate-pulse). */
const KEYFRAME = /(?:^|[\s"])animate-(?!none)[a-z]/;

const files = tsxFiles(SRC);

function offenders(pattern: RegExp) {
  const found: string[] = [];
  for (const file of files) {
    if (file.endsWith(".test.tsx")) continue;
    for (const literal of stringLiterals(readFileSync(file, "utf8"))) {
      if (pattern.test(literal) && !literal.includes("motion-reduce:")) {
        found.push(`${file.slice(SRC.length)} :: ${literal.slice(0, 120)}`);
      }
    }
  }
  return found;
}

describe("prefers-reduced-motion coverage of CSS motion (A11Y-5)", () => {
  test("the scan actually sees the component tree", () => {
    assert.ok(
      files.length > 40,
      `expected many .tsx files, found ${files.length}`,
    );
  });

  test("every hover/state transform has a motion-reduce counterpart", () => {
    assert.deepEqual(offenders(MOVEMENT), []);
  });

  test("every keyframe animation has a motion-reduce counterpart", () => {
    assert.deepEqual(offenders(KEYFRAME), []);
  });

  test("the guard fails on an unguarded movement class", () => {
    // Pins the detector itself: without this, an over-narrow regex would
    // make the two assertions above pass vacuously forever.
    assert.equal(MOVEMENT.test('"transition group-hover:scale-105"'), true);
    assert.equal(MOVEMENT.test('"transition hover:-translate-y-1"'), true);
    assert.equal(KEYFRAME.test('"h-8 w-8 animate-spin"'), true);
    assert.equal(
      MOVEMENT.test(
        '"group-hover:scale-105 motion-reduce:group-hover:scale-100"',
      ),
      true,
      "detector matches; the motion-reduce token is what clears it",
    );
    // Not movement: colour/opacity/shadow state changes must stay allowed.
    assert.equal(MOVEMENT.test('"transition-colors hover:text-white"'), false);
    assert.equal(MOVEMENT.test('"transition group-hover:opacity-100"'), false);
    assert.equal(KEYFRAME.test('"motion-reduce:animate-none"'), false);
  });
});
