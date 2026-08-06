/**
 * Design tokens extracted from the Figma "TFF design" file, Home page
 * frame (node 1:2), via visual/browser inspection on 2026-08-04 —
 * Figma MCP was rate-limited, so values come from Figma's own Properties
 * panel (exact rgba/px) plus the file's named Text/Color styles library.
 * Reuse these across every future section instead of re-reading Figma.
 */

export const color = {
  background: "#0C1025",
  primary: "#3882F6",
  secondary: "#8B5CF6",
  foreground: "#FFFFFF",
  muted: "#D8D8D8",
  glassBackground: "rgba(17, 16, 31, 0.2)",
  borderStrong: "#545768",
  borderSubtle: "#252838",
  innerShadow: "#212E49",
} as const;

export const gradient = {
  brand: `linear-gradient(90deg, ${color.primary} 0%, ${color.secondary} 100%)`,
} as const;

export * from "@/styles/typography";
export * from "@/styles/spacing";
export * from "@/styles/shadows";
export * from "@/styles/animations";
export * from "@/styles/breakpoints";
