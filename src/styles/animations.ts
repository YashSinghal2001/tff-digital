export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
  slower: 0.6,
} as const;

export const easing = {
  standard: [0.4, 0, 0.2, 1],
  out: [0, 0, 0.2, 1],
  in: [0.4, 0, 1, 1],
} as const;

/**
 * Scroll-triggered (not mount-triggered): elements below the fold don't
 * animate until scrolled into view, avoiding wasted main-thread work on
 * initial load for long pages.
 */
export const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: duration.slow, ease: easing.out },
} as const;

/**
 * Mount-triggered counterpart to fadeInUp, for content that sits above the
 * fold on its own page and must never wait on a scroll to become usable.
 *
 * fadeInUp's `whileInView` depends on an IntersectionObserver callback
 * firing; a cold load with no subsequent scroll (a link opened in a
 * background tab and switched to later, say) can leave it un-fired and
 * strand the wrapper at `opacity: 0, y: 24` — on the contact form that
 * means a dim, mis-positioned, effectively unclickable primary CTA
 * (audit FORM-RT-2). `animate` runs on mount, so the settled state is
 * reached regardless of scroll or observer timing.
 */
export const fadeInUpOnMount = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: duration.slow, ease: easing.out },
} as const;

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  transition: { duration: duration.base, ease: easing.standard },
} as const;

export const staggerChildren = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
} as const;

export const hoverLift = {
  whileHover: { y: -4 },
  transition: { duration: duration.fast, ease: easing.out },
} as const;
