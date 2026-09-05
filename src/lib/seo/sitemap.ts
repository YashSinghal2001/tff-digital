import "server-only";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { ROUTES } from "@/constants/routes";
import { getPosts } from "@/services/post.service";
import { getCaseStudies } from "@/services/case-study.service";
import {
  getCategoriesStrict,
  getTagsStrict,
} from "@/services/taxonomy.service";
import { getServiceOfferings } from "@/services/service-offering.service";
import { filterPlaceholderCaseStudies } from "@/lib/content/case-study-placeholders";

export interface SitemapEntry {
  url: string;
  lastModified?: string;
}

// Portfolio still has no route under src/app. Case Studies (src/app/case-studies)
// and per-slug Service pages (src/app/services/[slug]) do — both derived from
// WordPress below. No service URL is listed statically: the former bespoke
// /services/smm page is retired (the WordPress `smm` service now serves that
// URL) and /services/seo is a permanent redirect to /services/aeo-seo (see
// src/constants/redirects.ts), so neither is a canonical location.
const STATIC_ROUTES = [
  ROUTES.home,
  ROUTES.about,
  ROUTES.services,
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

// A taxonomy slug only makes a usable archive URL when it is exactly one
// non-empty path segment: the [slug] routes never match a slug carrying a
// "/" (or whitespace), and getCanonicalUrl's percent-encoding leaves XML
// delimiters like "&" untouched, which would break the sitemap document
// (Next.js does not escape <loc>). WordPress sanitizes slugs to plain or
// percent-encoded characters, so nothing legitimate is lost here.
function isRoutableTermSlug(slug: string): boolean {
  return /^[^\s/?#&<>"']+$/.test(slug);
}

// Category/tag archive pages are live, indexable routes linked from the blog
// sidebar, so they belong here too (SITEMAP-1). Strict fetchers inside this
// catch — one swallowing layer with a sitemap-specific message. The GraphQL
// queries use hideEmpty, so termless categories/tags never reach this code;
// the count guard repeats that intent locally for categories (the only term
// type whose count the fragment selects) and the slug guard keeps a
// malformed term from emitting a bare or unroutable URL. Neither Category
// nor Tag carries a modified date in the domain model, so these entries
// have no lastModified.
async function getTaxonomyEntries(): Promise<SitemapEntry[]> {
  try {
    const [categories, tags] = await Promise.all([
      getCategoriesStrict(),
      getTagsStrict(),
    ]);
    return [
      ...categories
        .filter(
          (category) => category.count > 0 && isRoutableTermSlug(category.slug),
        )
        .map((category) => ({
          url: getCanonicalUrl(ROUTES.blogCategory(category.slug)),
        })),
      ...tags
        .filter((tag) => isRoutableTermSlug(tag.slug))
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

// Same source of truth as the /services grid and the detail route's
// generateStaticParams (ARCH-1): every published WordPress service, in
// display_order. getServiceOfferings is already a soft getter, but the catch
// keeps this source's failure mode explicit and independent like the others.
async function getServiceOfferingEntries(): Promise<SitemapEntry[]> {
  try {
    const services = await getServiceOfferings({ first: 100 });
    return services.items
      .filter((service) => service.slug)
      .map((service) => ({
        url: getCanonicalUrl(ROUTES.service(service.slug)),
        lastModified: service.updatedAt,
      }));
  } catch (error) {
    console.error(
      "[getAllSitemapEntries] WPGraphQL request failed; sitemap will omit services for this build.",
      error,
    );
    return [];
  }
}

// A sitemap must not list the same <loc> twice. Sources are disjoint by
// construction, but a CMS entry whose slug collides with another source (or
// a duplicated node in a paginated reply) would otherwise slip through; the
// first occurrence wins so static routes keep precedence.
function dedupeByUrl(entries: SitemapEntry[]): SitemapEntry[] {
  const seen = new Set<string>();
  return entries.filter((entry) => {
    if (seen.has(entry.url)) return false;
    seen.add(entry.url);
    return true;
  });
}

export async function getAllSitemapEntries(): Promise<SitemapEntry[]> {
  const staticEntries: SitemapEntry[] = STATIC_ROUTES.map((route) => ({
    url: getCanonicalUrl(route),
  }));

  const [serviceEntries, postEntries, taxonomyEntries, caseStudyEntries] =
    await Promise.all([
      getServiceOfferingEntries(),
      getBlogPostEntries(),
      getTaxonomyEntries(),
      getCaseStudyEntries(),
    ]);

  return dedupeByUrl([
    ...staticEntries,
    ...serviceEntries,
    ...postEntries,
    ...taxonomyEntries,
    ...caseStudyEntries,
  ]);
}
