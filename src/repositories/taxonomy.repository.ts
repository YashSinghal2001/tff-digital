import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { parseWordPressResponse } from "@/lib/wordpress/parse-response";
import {
  wpCategoriesQueryResultSchema,
  wpTagsQueryResultSchema,
} from "@/schemas/api/wp-taxonomy.schema";
import { GET_CATEGORIES, GET_TAGS } from "@/graphql/queries/taxonomy.queries";
import type {
  WPCategoriesQueryResult,
  WPTagsQueryResult,
} from "@/types/api/wp-taxonomy";

// Responses validated at the boundary (audit CQ-1) — see
// src/lib/wordpress/parse-response.ts and post.repository.ts.

export async function findAllCategories(variables?: {
  first?: number;
}): Promise<WPCategoriesQueryResult> {
  return parseWordPressResponse(
    wpCategoriesQueryResultSchema,
    await fetchGraphQL(GET_CATEGORIES, variables),
    "GetCategories",
  );
}

export async function findAllTags(variables?: {
  first?: number;
}): Promise<WPTagsQueryResult> {
  return parseWordPressResponse(
    wpTagsQueryResultSchema,
    await fetchGraphQL(GET_TAGS, variables),
    "GetTags",
  );
}
