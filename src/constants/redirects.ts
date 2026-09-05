/**
 * Permanent (308) redirects applied by next.config.ts before the filesystem
 * router runs. Kept in a dependency-free module so the same table is unit
 * testable under `node --test`, which cannot load next.config.ts.
 *
 * /services/seo was a bespoke static page that competed with the WordPress
 * "AEO & SEO" service (slug aeo-seo) as a second indexable SEO page; it is
 * retired in favour of the CMS-driven route (ARCH-1 residual).
 */
export interface Redirect {
  source: string;
  destination: string;
  permanent: boolean;
}

export const SERVICE_REDIRECTS: readonly Redirect[] = [
  {
    source: "/services/seo",
    destination: "/services/aeo-seo",
    permanent: true,
  },
];
