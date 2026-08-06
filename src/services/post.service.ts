import "server-only";
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

export async function getPosts(params?: {
  first?: number;
  after?: string;
}): Promise<Paginated<Post>> {
  if (wordpressConfig.useMockData) {
    return getMockPosts(params);
  }

  const { posts } = await findAllPosts(params);
  return adaptPaginatedPosts(posts);
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (wordpressConfig.useMockData) {
    return getMockPostBySlug(slug);
  }

  const { post } = await findPostBySlug(slug);
  return post ? adaptPost(post) : null;
}

export async function getPostsByCategory(
  categorySlug: string,
  params?: { first?: number; after?: string },
): Promise<Paginated<Post>> {
  if (wordpressConfig.useMockData) {
    return getMockPostsByCategory(categorySlug, params);
  }

  const { posts } = await findPostsByCategory(categorySlug, params);
  return adaptPaginatedPosts(posts);
}

export async function getPostsByTag(
  tagSlug: string,
  params?: { first?: number; after?: string },
): Promise<Paginated<Post>> {
  if (wordpressConfig.useMockData) {
    return getMockPostsByTag(tagSlug, params);
  }

  const { posts } = await findPostsByTag(tagSlug, params);
  return adaptPaginatedPosts(posts);
}

export async function getPostsBySearch(
  search: string,
  params?: { first?: number; after?: string },
): Promise<Paginated<Post>> {
  if (wordpressConfig.useMockData) {
    return getMockPostsBySearch(search, params);
  }

  const { posts } = await findPostsBySearch(search, params);
  return adaptPaginatedPosts(posts);
}
