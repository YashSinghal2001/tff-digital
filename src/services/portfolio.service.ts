import "server-only";
// ARCH-2 (decided 2026-09-05): this Portfolio/Projects layer is KEPT DORMANT
// on purpose — nothing under src/app, src/sections or src/components may
// consume it, no /portfolio, /projects or /work route exists, and no ROUTES
// entry, sitemap source or navigation link points at it (enforced by
// src/constants/routes.test.ts). Case Studies are the live project surface.
// Reasons: the six published WordPress "Projects" are placeholder content
// (example.com URLs, no featured image, empty bodies) that must not go
// public; and the layer is not yet wired to the live schema — WPGraphQL
// exposes the CPT as `projects` / type `Project`, not the `portfolioItems` /
// `PortfolioItem` this query targets. Before activating: re-point the query
// and API types at the live type (verify fields with an authenticated
// introspection), add the zod boundary parse the other repositories have
// (CQ-1), gate on real content, then land route + ROUTES + sitemap + nav
// together in one change.
import { wordpressConfig } from "@/config/wordpress.config";
import {
  findAllPortfolioItems,
  findPortfolioItemBySlug,
} from "@/repositories/portfolio.repository";
import { adaptPortfolioItem } from "@/adapters/portfolio.adapter";
import {
  getMockPortfolioItemBySlug,
  getMockPortfolioItems,
} from "@/lib/mock/portfolio-items.mock";
import type { Paginated } from "@/types/domain/pagination";
import type { PortfolioItem } from "@/types/domain/portfolio-item";

export async function getPortfolioItems(params?: {
  first?: number;
  after?: string;
}): Promise<Paginated<PortfolioItem>> {
  if (wordpressConfig.useMockData) {
    return getMockPortfolioItems();
  }

  const { portfolioItems } = await findAllPortfolioItems(params);
  return {
    items: portfolioItems.nodes.map(adaptPortfolioItem),
    pageInfo: portfolioItems.pageInfo,
    totalCount: portfolioItems.nodes.length,
  };
}

export async function getPortfolioItemBySlug(
  slug: string,
): Promise<PortfolioItem | null> {
  if (wordpressConfig.useMockData) {
    return getMockPortfolioItemBySlug(slug);
  }

  const { portfolioItem } = await findPortfolioItemBySlug(slug);
  return portfolioItem ? adaptPortfolioItem(portfolioItem) : null;
}
