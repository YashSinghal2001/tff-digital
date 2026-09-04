"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Sitewide `prefers-reduced-motion` support (A11Y-5). The shared presets in
 * src/styles/animations.ts are plain objects spread into ~50 call sites, so
 * they can't branch per-user themselves; `reducedMotion="user"` makes
 * framer-motion disable transform/layout animation for users with the OS
 * preference set while still animating opacity — entrances become plain
 * fades instead of movement. Children arrive as props, so server components
 * stay server-rendered.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
