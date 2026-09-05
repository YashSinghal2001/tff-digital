import { ROUTES } from "@/constants/routes";
import type { RevalidateContentType } from "@/schemas/api/revalidate-webhook.schema";

/**
 * One revalidatePath() call: `kind: "page"` targets a dynamic route
 * pattern (every archive page under it), otherwise a concrete URL path.
 */
export interface RevalidationTarget {
  path: string;
  kind?: "page";
}

const SITEMAP = "/sitemap.xml";

/**
 * Which cached surfaces a WordPress change to one entry can have altered
 * (audit CACHE-1). Deliberately scoped per content type — the entry's own
 * detail page, the listings and homepage surfaces that render it, and the
 * sitemap — rather than a site-wide purge: an editor's update must never
 * mark unrelated pages stale, and during a CMS outage the blast radius of a
 * revalidation that cannot complete stays as small as possible.
 *
 * Publish, update, unpublish, trash and delete all resolve to the same
 * targets: for a removed entry the detail path re-renders to the 404 that
 * getXBySlug's null now produces, and the listings/sitemap drop it.
 */
export function resolveRevalidationTargets(payload: {
  type: RevalidateContentType;
  slug: string;
}): RevalidationTarget[] {
  switch (payload.type) {
    case "service":
      return [
        // Detail page, the /services grid, the homepage What We Do cards.
        { path: ROUTES.service(payload.slug) },
        { path: ROUTES.services },
        { path: ROUTES.home },
        { path: SITEMAP },
      ];
    case "case-study":
      return [
        // Detail page, the /case-studies listing, the homepage Selected Work.
        { path: ROUTES.caseStudy(payload.slug) },
        { path: ROUTES.caseStudies },
        { path: ROUTES.home },
        { path: SITEMAP },
      ];
    case "post":
      return [
        // Detail page, the blog index, and every category/tag archive that
        // could list it (dynamic routes — revalidated as a pattern).
        { path: ROUTES.blogPost(payload.slug) },
        { path: ROUTES.blog },
        { path: "/blog/category/[slug]", kind: "page" },
        { path: "/blog/tag/[slug]", kind: "page" },
        { path: SITEMAP },
      ];
  }
}
