"use client";

import { useCallback } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Stagger/entrance delays under `prefers-reduced-motion` (A11Y-5).
 *
 * `MotionConfig reducedMotion="user"` removes the movement from an entrance
 * but keeps the opacity fade — and it keeps that fade's `transition`, delay
 * included. A staggered grid therefore still trickles in column by column
 * for a user who asked for less motion. Content should simply be there, so
 * this collapses every entrance delay to 0 for those users.
 *
 * Returns a function rather than a number because most call sites compute a
 * per-item delay inside a `.map()`, where a hook cannot be called. Reads
 * framer's hook so MotionProvider stays the single source of truth for the
 * React tree; it returns null during SSR, which correctly means "no
 * preference known yet, keep the delay" and cannot desync hydration because
 * the delay is never serialised into the HTML.
 */
export function useEntranceDelay(): (delay: number) => number {
  const reduceMotion = useReducedMotion();
  return useCallback(
    (delay: number) => (reduceMotion ? 0 : delay),
    [reduceMotion],
  );
}
