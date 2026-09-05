import assert from "node:assert/strict";
import test, { afterEach, describe } from "node:test";

import {
  REDUCED_MOTION_QUERY,
  getScrollBehavior,
  prefersReducedMotion,
} from "./reduced-motion.ts";

// A11Y-5: the JS-driven half of reduced motion. CSS and framer-motion cannot
// see an imperative scrollIntoView, so this module decides its behaviour —
// and it must never throw or block scrolling in an environment that has no
// matchMedia at all (SSR, older embedded engines).

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");

function setWindow(value: unknown) {
  Object.defineProperty(globalThis, "window", {
    value,
    configurable: true,
    writable: true,
  });
}

/** Records the queries asked for, so the exact media query is pinned. */
function windowMatching(matches: boolean, asked: string[] = []) {
  return {
    matchMedia: (query: string) => {
      asked.push(query);
      return { matches, media: query };
    },
  };
}

describe("prefersReducedMotion", () => {
  afterEach(() => {
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  });

  test("true when the user prefers reduced motion", () => {
    const asked: string[] = [];
    setWindow(windowMatching(true, asked));
    assert.equal(prefersReducedMotion(), true);
    assert.deepEqual(asked, [REDUCED_MOTION_QUERY]);
    assert.equal(REDUCED_MOTION_QUERY, "(prefers-reduced-motion: reduce)");
  });

  test("false when the query does not match", () => {
    setWindow(windowMatching(false));
    assert.equal(prefersReducedMotion(), false);
  });

  test("false during SSR, where there is no window", () => {
    setWindow(undefined);
    assert.equal(prefersReducedMotion(), false);
  });

  test("false when the environment has no matchMedia", () => {
    setWindow({});
    assert.equal(prefersReducedMotion(), false);
  });

  test("false, not a crash, when matchMedia throws", () => {
    setWindow({
      matchMedia: () => {
        throw new TypeError("unsupported query");
      },
    });
    assert.doesNotThrow(() => prefersReducedMotion());
    assert.equal(prefersReducedMotion(), false);
  });
});

describe("getScrollBehavior", () => {
  afterEach(() => {
    if (originalWindow)
      Object.defineProperty(globalThis, "window", originalWindow);
    else Reflect.deleteProperty(globalThis, "window");
  });

  test("jumps instantly for reduced-motion users", () => {
    setWindow(windowMatching(true));
    assert.equal(getScrollBehavior(), "auto");
  });

  test("keeps smooth scrolling for everyone else", () => {
    setWindow(windowMatching(false));
    assert.equal(getScrollBehavior(), "smooth");
  });

  test("defaults to smooth where the preference cannot be read", () => {
    setWindow(undefined);
    assert.equal(getScrollBehavior(), "smooth");
  });
});
