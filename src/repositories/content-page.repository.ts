import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { parseWordPressResponse } from "@/lib/wordpress/parse-response";
import {
  wpPageQueryResultSchema,
  wpPagesQueryResultSchema,
} from "@/schemas/api/wp-page.schema";
import { GET_PAGE_BY_SLUG, GET_PAGES } from "@/graphql/queries/page.queries";
import type {
  WPPageQueryResult,
  WPPagesQueryResult,
} from "@/types/api/wp-page";

// Responses validated at the boundary (audit CQ-1) — see
// src/lib/wordpress/parse-response.ts and post.repository.ts.

export async function findPageBySlug(slug: string): Promise<WPPageQueryResult> {
  return parseWordPressResponse(
    wpPageQueryResultSchema,
    await fetchGraphQL(GET_PAGE_BY_SLUG, { slug }),
    "GetPageBySlug",
  );
}

export async function findAllPages(variables?: {
  first?: number;
  after?: string;
}): Promise<WPPagesQueryResult> {
  return parseWordPressResponse(
    wpPagesQueryResultSchema,
    await fetchGraphQL(GET_PAGES, variables),
    "GetPages",
  );
}
