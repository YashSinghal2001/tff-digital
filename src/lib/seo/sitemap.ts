import "server-only";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { ROUTES } from "@/constants/routes";
import { getPosts } from "@/services/post.service";

export interface SitemapEntry {
  url: string;
  lastModified?: string;
}

// Only routes that resolve to an actual page today. Portfolio, Case Studies,
// and per-slug Service pages have a full repository/service/mock layer
// already built (see src/services/{portfolio,case-study,service-offering}
// .service.ts) but no route under src/app yet — listing them here would put
// 404s in the sitemap. Add them back once those pages ship.
const STATIC_ROUTES = [
  ROUTES.home,
  ROUTES.about,
  ROUTES.services,
  ROUTES.service("seo"),
  ROUTES.service("smm"),
  ROUTES.blog,
  ROUTES.contact,
];

export async function getAllSitemapEntries(): Promise<SitemapEntry[]> {
  const posts = await getPosts({ first: 1000 });

  const staticEntries: SitemapEntry[] = STATIC_ROUTES.map((route) => ({
    url: getCanonicalUrl(route),
  }));

  const postEntries: SitemapEntry[] = posts.items.map((post) => ({
    url: getCanonicalUrl(ROUTES.blogPost(post.slug)),
    lastModified: post.updatedAt,
  }));

  return [...staticEntries, ...postEntries];
}
