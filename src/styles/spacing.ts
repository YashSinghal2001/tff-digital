/**
 * 4px-based spacing scale, extended with the exact values measured on
 * Figma instances (button/badge padding, card gaps, nav offsets).
 */
export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  7: "28px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
} as const;

export const containerWidth = {
  content: "1280px",
  frame: "1440px",
} as const;

/** Desktop (1440 frame) side gutter measured from Nav BAR left offset. */
export const pageGutter = {
  desktop: "80px",
  tablet: "40px",
  mobile: "20px",
} as const;

export const sectionSpacing = {
  desktop: "96px",
  tablet: "64px",
  mobile: "48px",
} as const;

export const radius = {
  sm: "8px",
  md: "16px",
  lg: "25px",
  full: "9999px",
} as const;
