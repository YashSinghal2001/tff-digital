import "server-only";
import { cache } from "react";
import { wordpressConfig } from "@/config/wordpress.config";
import {
  findAllPosts,
  findPostBySlug,
  findPostsByCategory,
  findPostsByTag,
  findPostsBySearch,
} from "@/repositories/post.repository";
import { adaptPost } from "@/adapters/post.adapter";
import {
  getMockPostBySlug,
  getMockPosts,
  getMockPostsByCategory,
  getMockPostsByTag,
  getMockPostsBySearch,
} from "@/lib/mock/posts.mock";
import type { WPConnection } from "@/types/api/wp-connection";
import type { WPPost } from "@/types/api/wp-post";
import type { Paginated } from "@/types/domain/pagination";
import type { Post } from "@/types/domain/post";

function adaptPaginatedPosts(posts: WPConnection<WPPost>): Paginated<Post> {
  return {
    items: posts.nodes.map(adaptPost),
    pageInfo: posts.pageInfo,
    totalCount: posts.nodes.length,
  };
}

const EMPTY_POSTS: Paginated<Post> = {
  items: [],
  pageInfo: {
    hasNextPage: false,
    hasPreviousPage: false,
    startCursor: null,
    endCursor: null,
  },
  totalCount: 0,
};

/**
 * Throwing variant: a WPGraphQL failure propagates to the caller. Use for a
 * page's PRIMARY content (the blog listing's results) so an outage surfaces
 * as the route's error boundary (a 5xx — "temporary, come back later")
 * instead of a 200 asserting the blog is empty. That misleading empty state
 * shipped live during the 2026-08 CMS outage and is exactly what crawlers
 * must not index.
 */
export async function getPostsStrict(params?: {
  first?: number;
  after?: string;
}): Promise<Paginated<Post>> {
  if (wordpressConfig.useMockData) {
    return getMockPosts(params);
  }

  const { posts } = await findAllPosts(params);
  return adaptPaginatedPosts(posts);
}

export async function getPosts(params?: {
  first?: number;
  after?: string;
}): Promise<Paginated<Post>> {
  try {
    return await getPostsStrict(params);
  } catch (error) {
    // Soft variant for secondary surfaces (sidebars, related posts,
    // generateStaticParams) and the sitemap: a live WPGraphQL outage would
    // otherwise take down content that renders fine without posts, matching
    // getServiceOfferings' resilience pattern.
    console.error(
      "[getPosts] WPGraphQL request failed; rendering without live posts for this build.",
      error,
    );
    return EMPTY_POSTS;
  }
}

// React cache(): generateMetadata and the page body both look up the same
// slug in the same request, and Next's fetch memoization never dedupes these
// calls (POST + AbortSignal both opt out) — so without this each render
// invoked the WPGraphQL fetch twice (PERF-4). Scope is one server request;
// nothing persists across requests or leaks between slugs.
export const getPostBySlug = cache(
  async (slug: string): Promise<Post | null> => {
    if (wordpressConfig.useMockData) {
      return getMockPostBySlug(slug);
    }

    const { post } = await findPostBySlug(slug);
    return post ? adaptPost(post) : null;
  },
);

export async function getPostsByCategory(
  categorySlug: string,
  params?: { first?: number; after?: string },
): Promise<Paginated<Post>> {
  if (wordpressConfig.useMockData) {
    return getMockPostsByCategory(categorySlug, params);
  }

  try {
    const { posts } = await findPostsByCategory(categorySlug, params);
    return adaptPaginatedPosts(posts);
  } catch (error) {
    console.error(
      "[getPostsByCategory] WPGraphQL request failed; rendering without live posts for this build.",
      error,
    );
    return EMPTY_POSTS;
  }
}

export async function getPostsByTag(
  tagSlug: string,
  params?: { first?: number; after?: string },
): Promise<Paginated<Post>> {
  if (wordpressConfig.useMockData) {
    return getMockPostsByTag(tagSlug, params);
  }

  try {
    const { posts } = await findPostsByTag(tagSlug, params);
    return adaptPaginatedPosts(posts);
  } catch (error) {
    console.error(
      "[getPostsByTag] WPGraphQL request failed; rendering without live posts for this build.",
      error,
    );
    return EMPTY_POSTS;
  }
}

/** Throwing variant of getPostsBySearch — see getPostsStrict for when. */
export async function getPostsBySearchStrict(
  search: string,
  params?: { first?: number; after?: string },
): Promise<Paginated<Post>> {
  if (wordpressConfig.useMockData) {
    return getMockPostsBySearch(search, params);
  }

  const { posts } = await findPostsBySearch(search, params);
  return adaptPaginatedPosts(posts);
}

export async function getPostsBySearch(
  search: string,
  params?: { first?: number; after?: string },
): Promise<Paginated<Post>> {
  try {
    return await getPostsBySearchStrict(search, params);
  } catch (error) {
    console.error(
      "[getPostsBySearch] WPGraphQL request failed; rendering without live posts for this build.",
      error,
    );
    return EMPTY_POSTS;
  }
}
