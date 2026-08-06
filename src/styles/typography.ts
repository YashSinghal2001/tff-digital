export const fontFamily = {
  heading: "var(--font-poppins)",
  body: "var(--font-open-sans)",
} as const;

export const fontWeight = {
  regular: 400,
  semibold: 600,
  bold: 700,
} as const;

/**
 * Named type scale from the Figma "TFF" text styles library
 * (H1 TFF ... P3 TFF), line-heights left at Figma's "Auto" (~1.2)
 * unless a specific override was measured on an instance.
 */
export const typeScale = {
  display: { fontSize: "60px", lineHeight: "1.1", fontWeight: fontWeight.bold },
  h1: { fontSize: "48px", lineHeight: "1.2", fontWeight: fontWeight.bold },
  h2: { fontSize: "40px", lineHeight: "1.2", fontWeight: fontWeight.bold },
  h3: { fontSize: "36px", lineHeight: "1.2", fontWeight: fontWeight.bold },
  h4: { fontSize: "32px", lineHeight: "1.2", fontWeight: fontWeight.bold },
  h5: { fontSize: "24px", lineHeight: "1.2", fontWeight: fontWeight.bold },
  h6: { fontSize: "16px", lineHeight: "1.2", fontWeight: fontWeight.bold },
  p1: { fontSize: "16px", lineHeight: "1.5", fontWeight: fontWeight.regular },
  p2: { fontSize: "14px", lineHeight: "1.5", fontWeight: fontWeight.regular },
  p3: { fontSize: "12px", lineHeight: "1.5", fontWeight: fontWeight.regular },
} as const;

export const letterSpacing = {
  normal: "0",
} as const;

export type TypeScaleKey = keyof typeof typeScale;
