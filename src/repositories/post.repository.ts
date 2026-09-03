import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import { parseWordPressResponse } from "@/lib/wordpress/parse-response";
import {
  wpPostQueryResultSchema,
  wpPostsQueryResultSchema,
} from "@/schemas/api/wp-post.schema";
import {
  GET_POSTS,
  GET_POST_BY_SLUG,
  GET_POSTS_BY_CATEGORY,
  GET_POSTS_BY_TAG,
  GET_POSTS_SEARCH,
} from "@/graphql/queries/post.queries";
import type {
  WPPostQueryResult,
  WPPostsQueryResult,
} from "@/types/api/wp-post";

// Every response is validated at this boundary before it enters the app
// (audit CQ-1) — see src/lib/wordpress/parse-response.ts. The explicit
// return types keep each function's contract identical to the pre-CQ-1
// bare-cast version, so services and adapters are untouched.

export async function findAllPosts(variables?: {
  first?: number;
  after?: string;
}): Promise<WPPostsQueryResult> {
  return parseWordPressResponse(
    wpPostsQueryResultSchema,
    await fetchGraphQL(GET_POSTS, variables),
    "GetPosts",
  );
}

export async function findPostBySlug(slug: string): Promise<WPPostQueryResult> {
  return parseWordPressResponse(
    wpPostQueryResultSchema,
    await fetchGraphQL(GET_POST_BY_SLUG, { slug }),
    "GetPostBySlug",
  );
}

export async function findPostsByCategory(
  categorySlug: string,
  variables?: { first?: number; after?: string },
): Promise<WPPostsQueryResult> {
  return parseWordPressResponse(
    wpPostsQueryResultSchema,
    await fetchGraphQL(GET_POSTS_BY_CATEGORY, { categorySlug, ...variables }),
    "GetPostsByCategory",
  );
}

export async function findPostsByTag(
  tagSlug: string,
  variables?: { first?: number; after?: string },
): Promise<WPPostsQueryResult> {
  return parseWordPressResponse(
    wpPostsQueryResultSchema,
    await fetchGraphQL(GET_POSTS_BY_TAG, { tagSlug, ...variables }),
    "GetPostsByTag",
  );
}

export async function findPostsBySearch(
  search: string,
  variables?: { first?: number; after?: string },
): Promise<WPPostsQueryResult> {
  return parseWordPressResponse(
    wpPostsQueryResultSchema,
    await fetchGraphQL(GET_POSTS_SEARCH, { search, ...variables }),
    "GetPostsSearch",
  );
}
