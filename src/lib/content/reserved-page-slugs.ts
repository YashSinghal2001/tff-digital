/**
 * WordPress Page slugs that must never render through the generic
 * `/[slug]` route (CLIENT-1). Two categories, kept in one list because a
 * collision is a collision either way:
 *
 * 1. Every top-level static route this app already owns — Next.js's own
 *    routing precedence guarantees the static folder always wins over the
 *    sibling `[slug]` route for these exact paths, so this list is not
 *    what makes them safe. It is a second, independent guard (belt and
 *    suspenders for a "critical" collision class) and, more importantly,
 *    it is what keeps generateStaticParams and the sitemap from ever
 *    offering a competing static path for one of these slugs, and what
 *    the route itself checks before ever calling WordPress.
 * 2. `portfolio` / `projects` / `work` — not an existing route today, but
 *    a WordPress Page happening to use one of these slugs would otherwise
 *    silently open the exact URL ARCH-2 deliberately left unclaimed for
 *    the (currently dormant) Projects content type. Mirrors that decision
 *    rather than reopening it — see src/constants/routes.test.ts's
 *    DORMANT_PATH pattern, which this list is kept in sync with.
 */
export const RESERVED_PAGE_SLUGS = new Set([
  "about",
  "blog",
  "case-studies",
  "contact",
  "privacy-policy",
  "services",
  "terms-and-conditions",
  "thank-you",
  "cookie-policy",
  "api",
  "portfolio",
  "projects",
  "work",
]);

export function isReservedPageSlug(slug: string): boolean {
  return RESERVED_PAGE_SLUGS.has(slug);
}

/** The published WordPress Pages minus every reserved slug — the single
 *  source generateStaticParams and the sitemap both filter through, so a
 *  colliding Page can never be offered as a static path or listed. */
export function filterReservedPageSlugs<T extends { slug: string }>(
  items: T[],
): T[] {
  return items.filter((item) => item.slug && !isReservedPageSlug(item.slug));
}
