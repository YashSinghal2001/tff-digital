import "server-only";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { ROUTES } from "@/constants/routes";
import { getPosts } from "@/services/post.service";
import { getCaseStudies } from "@/services/case-study.service";
import {
  getCategoriesStrict,
  getTagsStrict,
} from "@/services/taxonomy.service";
// TEMPORARY: WP service entries are not emitted here yet — the grids are
// WordPress-driven (ARCH-1) but the sitemap step is a separate follow-up.
// TODO: RESTORE WORDPRESS DATA
// import { getServiceOfferings } from "@/services/service-offering.service";
import { filterPlaceholderCaseStudies } from "@/lib/content/case-study-placeholders";

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
    // Same source of truth as the listing/detail pages: published WordPress
    // case studies appear; the throwaway WP "test" entry never does.
    return filterPlaceholderCaseStudies(caseStudies.items).map((caseStudy) => ({
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

// Category/tag archive pages are live, indexable routes linked from the blog
// sidebar, so they belong here too (SITEMAP-1). Strict fetchers inside this
// catch — one swallowing layer with a sitemap-specific message. The GraphQL
// queries use hideEmpty, so termless categories/tags never reach this code;
// the slug guard keeps a malformed empty-slug term from emitting a bare
// /blog/category/ URL. Neither Category nor Tag carries a modified date in
// the domain model, so these entries have no lastModified.
async function getTaxonomyEntries(): Promise<SitemapEntry[]> {
  try {
    const [categories, tags] = await Promise.all([
      getCategoriesStrict(),
      getTagsStrict(),
    ]);
    return [
      ...categories
        .filter((category) => category.slug)
        .map((category) => ({
          url: getCanonicalUrl(ROUTES.blogCategory(category.slug)),
        })),
      ...tags
        .filter((tag) => tag.slug)
        .map((tag) => ({ url: getCanonicalUrl(ROUTES.blogTag(tag.slug)) })),
    ];
  } catch (error) {
    console.error(
      "[getAllSitemapEntries] WPGraphQL request failed; sitemap will omit blog categories/tags for this build.",
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

  const [postEntries, taxonomyEntries, caseStudyEntries] = await Promise.all([
    getBlogPostEntries(),
    getTaxonomyEntries(),
    getCaseStudyEntries(),
  ]);

  return [
    ...staticEntries,
    ...postEntries,
    ...taxonomyEntries,
    ...caseStudyEntries,
  ];
}
