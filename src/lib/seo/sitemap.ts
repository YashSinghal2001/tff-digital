import "server-only";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { ROUTES } from "@/constants/routes";
import { getPosts } from "@/services/post.service";
import { getCaseStudies } from "@/services/case-study.service";
// TEMPORARY: WP service entries removed from the sitemap while the CMS holds
// placeholder services — see src/data/temporary-services.ts.
// TODO: RESTORE WORDPRESS DATA
// import { getServiceOfferings } from "@/services/service-offering.service";
import { withCaseStudyFallback } from "@/lib/fallback/case-studies.fallback";

export interface SitemapEntry {
  url: string;
  lastModified?: string;
}

// Portfolio still has no route under src/app. Case Studies (src/app/case-studies)
// and generic per-slug Service pages (src/app/services/[slug]) do — both included
// below. /services/seo and /services/smm are bespoke pages with no matching
// WordPress service slug (confirmed live), so they stay listed here as statics
// rather than being derivable from the service repository.
const STATIC_ROUTES = [
  ROUTES.home,
  ROUTES.about,
  ROUTES.services,
  ROUTES.service("seo"),
  ROUTES.service("smm"),
  ROUTES.blog,
  ROUTES.caseStudies,
  ROUTES.contact,
  ROUTES.privacyPolicy,
  ROUTES.termsAndConditions,
];

// sitemap.xml is statically generated at build time; a WPGraphQL outage here
// would otherwise fail the whole Vercel build. Each dynamic source degrades
// independently — a failure fetching one (e.g. case studies) still lets the
// other (e.g. blog posts) appear, rather than blanking out both.
async function getBlogPostEntries(): Promise<SitemapEntry[]> {
  try {
    const posts = await getPosts({ first: 1000 });
    return posts.items.map((post) => ({
      url: getCanonicalUrl(ROUTES.blogPost(post.slug)),
      lastModified: post.updatedAt,
    }));
  } catch (error) {
    console.error(
      "[getAllSitemapEntries] WPGraphQL request failed; sitemap will omit blog posts for this build.",
      error,
    );
    return [];
  }
}

async function getCaseStudyEntries(): Promise<SitemapEntry[]> {
  try {
    const caseStudies = await getCaseStudies({ first: 1000 });
    // Same source of truth as the listing/detail pages: the throwaway WP
    // "test" entry never appears, and while WordPress has no real case
    // studies the two fallback entries (which are live, linked pages) do.
    return withCaseStudyFallback(caseStudies.items).map((caseStudy) => ({
      url: getCanonicalUrl(ROUTES.caseStudy(caseStudy.slug)),
      lastModified: caseStudy.updatedAt,
    }));
  } catch (error) {
    console.error(
      "[getAllSitemapEntries] WPGraphQL request failed; sitemap will omit case studies for this build.",
      error,
    );
    return [];
  }
}

// TEMPORARY: WP service entries removed while the CMS holds placeholder
// services. TODO: RESTORE WORDPRESS DATA — restore this alongside the grids:
// async function getServiceOfferingEntries(): Promise<SitemapEntry[]> {
//   try {
//     const services = await getServiceOfferings({ first: 1000 });
//     return services.items.map((service) => ({
//       url: getCanonicalUrl(ROUTES.service(service.slug)),
//       lastModified: service.updatedAt,
//     }));
//   } catch (error) {
//     console.error(
//       "[getAllSitemapEntries] WPGraphQL request failed; sitemap will omit services for this build.",
//       error,
//     );
//     return [];
//   }
// }

export async function getAllSitemapEntries(): Promise<SitemapEntry[]> {
  const staticEntries: SitemapEntry[] = STATIC_ROUTES.map((route) => ({
    url: getCanonicalUrl(route),
  }));

  const [postEntries, caseStudyEntries] = await Promise.all([
    getBlogPostEntries(),
    getCaseStudyEntries(),
  ]);

  return [...staticEntries, ...postEntries, ...caseStudyEntries];
}
