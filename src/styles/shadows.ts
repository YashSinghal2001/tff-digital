/**
 * Glass-surface pattern reused across nav, buttons, badges, and cards:
 * a translucent dark fill + 1px border + a soft inner shadow.
 */
export const glassSurface = {
  background: "rgba(17, 16, 31, 0.2)",
  border: "1px solid rgba(84, 87, 104, 1)",
  borderSubtle: "1px solid rgba(37, 40, 56, 1)",
} as const;

export const shadow = {
  innerGlass: "inset 0px 4px 4px 0px rgba(33, 46, 73, 1)",
  card: "0px 8px 24px 0px rgba(0, 0, 0, 0.25)",
  glow: "0px 0px 40px 0px rgba(56, 130, 246, 0.35)",
} as const;

export const blur = {
  sm: "8px",
  md: "16px",
  lg: "32px",
} as const;
