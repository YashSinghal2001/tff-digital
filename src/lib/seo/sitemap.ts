import "server-only";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { ROUTES } from "@/constants/routes";
import { getPosts } from "@/services/post.service";
import { getCaseStudies } from "@/services/case-study.service";

export interface SitemapEntry {
  url: string;
  lastModified?: string;
}

// Portfolio and per-slug Service pages still have no route under src/app —
// Case Studies do (src/app/case-studies), so they're included below.
const STATIC_ROUTES = [
  ROUTES.home,
  ROUTES.about,
  ROUTES.services,
  ROUTES.service("seo"),
  ROUTES.service("smm"),
  ROUTES.blog,
  ROUTES.caseStudies,
  ROUTES.contact,
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
    return caseStudies.items.map((caseStudy) => ({
      url: getCanonicalUrl(ROUTES.caseStudy(caseStudy.slug)),
    }));
  } catch (error) {
    console.error(
      "[getAllSitemapEntries] WPGraphQL request failed; sitemap will omit case studies for this build.",
      error,
    );
    return [];
  }
}

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
