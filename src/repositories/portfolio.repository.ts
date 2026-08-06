import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import {
  GET_PORTFOLIO_ITEM_BY_SLUG,
  GET_PORTFOLIO_ITEMS,
} from "@/graphql/queries/portfolio.queries";
import type {
  WPPortfolioItemQueryResult,
  WPPortfolioItemsQueryResult,
} from "@/types/api/wp-portfolio";

export function findAllPortfolioItems(variables?: {
  first?: number;
  after?: string;
}) {
  return fetchGraphQL<WPPortfolioItemsQueryResult>(
    GET_PORTFOLIO_ITEMS,
    variables,
  );
}

export function findPortfolioItemBySlug(slug: string) {
  return fetchGraphQL<WPPortfolioItemQueryResult>(GET_PORTFOLIO_ITEM_BY_SLUG, {
    slug,
  });
}
