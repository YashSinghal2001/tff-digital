import "server-only";
import { wordpressConfig } from "@/config/wordpress.config";
import {
  findAllPages,
  findPageBySlug,
} from "@/repositories/content-page.repository";
import { adaptContentPage } from "@/adapters/content-page.adapter";
import { getMockPageBySlug, getMockPages } from "@/lib/mock/pages.mock";
import type { Paginated } from "@/types/domain/pagination";
import type { ContentPage } from "@/types/domain/content-page";

const EMPTY_PAGES: Paginated<ContentPage> = {
  items: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  },
  totalCount: 0,
};

export async function getPageBySlug(slug: string): Promise<ContentPage | null> {
  if (wordpressConfig.useMockData) {
    return getMockPageBySlug(slug);
  }

  const { page } = await findPageBySlug(slug);
  return page ? adaptContentPage(page) : null;
}

/**
 * Soft (non-throwing) list getter for generateStaticParams and the
 * sitemap (CLIENT-1) — matches getServiceOfferings' resilience pattern
 * exactly: a build-time WPGraphQL outage degrades to an empty, still-live-
 * sourced result so the build still succeeds, instead of failing it.
 * Secondary surface only; nothing renders a Page as its primary content
 * the way a detail route renders its own by-slug lookup, so there is no
 * strict/throwing counterpart to pair this with.
 */
export async function getPages(): Promise<Paginated<ContentPage>> {
  if (wordpressConfig.useMockData) {
    return {
      ...EMPTY_PAGES,
      items: getMockPages(),
      totalCount: getMockPages().length,
    };
  }

  try {
    const { pages } = await findAllPages({ first: 50 });
    const items = pages.nodes.map(adaptContentPage);
    return { items, pageInfo: pages.pageInfo, totalCount: items.length };
  } catch (error) {
    console.error(
      "[getPages] WPGraphQL request failed; rendering without live WordPress pages for this build.",
      error,
    );
    return EMPTY_PAGES;
  }
}
