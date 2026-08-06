import "server-only";
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
