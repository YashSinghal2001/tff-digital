import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
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

export function findAllPosts(variables?: { first?: number; after?: string }) {
  return fetchGraphQL<WPPostsQueryResult>(GET_POSTS, variables);
}

export function findPostBySlug(slug: string) {
  return fetchGraphQL<WPPostQueryResult>(GET_POST_BY_SLUG, { slug });
}

export function findPostsByCategory(
  categorySlug: string,
  variables?: { first?: number; after?: string },
) {
  return fetchGraphQL<WPPostsQueryResult>(GET_POSTS_BY_CATEGORY, {
    categorySlug,
    ...variables,
  });
}

export function findPostsByTag(
  tagSlug: string,
  variables?: { first?: number; after?: string },
) {
  return fetchGraphQL<WPPostsQueryResult>(GET_POSTS_BY_TAG, {
    tagSlug,
    ...variables,
  });
}

export function findPostsBySearch(
  search: string,
  variables?: { first?: number; after?: string },
) {
  return fetchGraphQL<WPPostsQueryResult>(GET_POSTS_SEARCH, {
    search,
    ...variables,
  });
}
