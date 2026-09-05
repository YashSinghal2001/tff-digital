/**
 * `prefers-reduced-motion` primitives (A11Y-5).
 *
 * The sitewide strategy has three layers, and this module is the one that
 * covers motion neither of the other two can reach:
 *
 * 1. framer-motion — `MotionConfig reducedMotion="user"` in MotionProvider
 *    makes every JS animation skip positional keys (transform, width,
 *    height, top/left/right/bottom) and jump straight to the target, while
 *    opacity still fades. Entrances therefore become plain fades.
 * 2. CSS — Tailwind's `motion-reduce:` variant neutralises the transform
 *    on hover/state transitions and the two keyframe loaders. Colour,
 *    shadow and opacity transitions are deliberately kept: they carry
 *    state (focus, hover, validity) and are not vestibular triggers.
 * 3. This module — motion driven imperatively from JavaScript, which
 *    neither of the above sees: today the smooth scrolling behind hash
 *    navigation.
 *
 * Framework-free on purpose, so it is unit-testable and usable from plain
 * event handlers. React components inside the MotionConfig tree should
 * prefer framer's `useReducedMotion()` (see `useEntranceDelay`) so that
 * one provider stays the single source of truth for the React tree.
 */
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Reads the OS/browser preference at call time. False during SSR and in any
 * environment without `matchMedia`: motion is the safe default there, since
 * the value is only ever used to *remove* animation, never to add it.
 */
export function prefersReducedMotion(): boolean {
  if (
    typeof window === "undefined" ||
    typeof window.matchMedia !== "function"
  ) {
    return false;
  }
  try {
    return window.matchMedia(REDUCED_MOTION_QUERY).matches;
  } catch {
    // Some embedded/older engines throw on an unsupported query rather than
    // returning a non-matching list; a broken query must not break scrolling.
    return false;
  }
}

/**
 * Scroll behaviour for programmatic scrolling. "auto" (an instant jump) for
 * users who prefer reduced motion: a long smooth scroll across a page is
 * exactly the sustained movement the preference exists to suppress, and the
 * destination is identical either way.
 */
export function getScrollBehavior(): ScrollBehavior {
  return prefersReducedMotion() ? "auto" : "smooth";
}
