import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { GET_CATEGORIES, GET_TAGS } from "@/graphql/queries/taxonomy.queries";
import type {
  WPCategoriesQueryResult,
  WPTagsQueryResult,
} from "@/types/api/wp-taxonomy";

export function findAllCategories(variables?: { first?: number }) {
  return fetchGraphQL<WPCategoriesQueryResult>(GET_CATEGORIES, variables);
}

export function findAllTags(variables?: { first?: number }) {
  return fetchGraphQL<WPTagsQueryResult>(GET_TAGS, variables);
}
