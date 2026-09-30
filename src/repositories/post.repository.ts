import "server-only";
import { fetchGraphQL } from "@/lib/wordpress/client";
import {
  keepValidWordPressNodes,
  parseWordPressResponse,
} from "@/lib/wordpress/parse-response";
import {
  wpPostEnvelopeSchema,
  wpPostSchema,
  wpPostsEnvelopeSchema,
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
//
// Posts are validated per record (2026-09 spam incident: ~3,000 injected
// posts with `modified: null`): the envelope must be well-formed, but an
// individual post failing the strict wpPostSchema is dropped — never
// rendered, never listed, never in the sitemap — instead of failing the
// whole listing.

async function fetchPosts(
  query: string,
  variables: Record<string, unknown> | undefined,
  queryLabel: string,
): Promise<WPPostsQueryResult> {
  const { posts } = parseWordPressResponse(
    wpPostsEnvelopeSchema,
    await fetchGraphQL(query, variables),
    queryLabel,
  );
  return {
    posts: {
      ...posts,
      nodes: keepValidWordPressNodes(wpPostSchema, posts.nodes, queryLabel),
    },
  };
}

export async function findAllPosts(variables?: {
  first?: number;
  after?: string;
}): Promise<WPPostsQueryResult> {
  return fetchPosts(GET_POSTS, variables, "GetPosts");
}

// A malformed single post resolves to null, so the route 404s instead of
// rendering it or 500ing. Network/envelope failures still throw (5xx), so
// a CMS outage never turns a real article into a de-indexing 404.
export async function findPostBySlug(slug: string): Promise<WPPostQueryResult> {
  const { post } = parseWordPressResponse(
    wpPostEnvelopeSchema,
    await fetchGraphQL(GET_POST_BY_SLUG, { slug }),
    "GetPostBySlug",
  );
  if (post == null) return { post: null };
  const [valid] = keepValidWordPressNodes(wpPostSchema, [post], "GetPostBySlug");
  return { post: valid ?? null };
}

export async function findPostsByCategory(
  categorySlug: string,
  variables?: { first?: number; after?: string },
): Promise<WPPostsQueryResult> {
  return fetchPosts(
    GET_POSTS_BY_CATEGORY,
    { categorySlug, ...variables },
    "GetPostsByCategory",
  );
}

export async function findPostsByTag(
  tagSlug: string,
  variables?: { first?: number; after?: string },
): Promise<WPPostsQueryResult> {
  return fetchPosts(GET_POSTS_BY_TAG, { tagSlug, ...variables }, "GetPostsByTag");
}

export async function findPostsBySearch(
  search: string,
  variables?: { first?: number; after?: string },
): Promise<WPPostsQueryResult> {
  return fetchPosts(GET_POSTS_SEARCH, { search, ...variables }, "GetPostsSearch");
}
