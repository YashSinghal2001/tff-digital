import type { Post } from "@/types/domain/post";
import type { Paginated } from "@/types/domain/pagination";
import {
  buildMockSeo,
  mockAuthor,
  mockCategories,
  mockMedia,
  mockTags,
} from "@/lib/mock/shared.mock";

export const mockPosts: Post[] = [
  {
    id: "mock-post-1",
    databaseId: 1,
    slug: "getting-started-with-headless-wordpress",
    title: "Getting Started with Headless WordPress",
    excerpt: "Placeholder excerpt for the first mock post.",
    content: "<p>Placeholder content.</p>",
    publishedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    featuredImage: mockMedia,
    author: mockAuthor,
    categories: [mockCategories[0]],
    tags: [mockTags[0]],
    seo: buildMockSeo(
      "Getting Started with Headless WordPress",
      "Placeholder excerpt for the first mock post.",
      "article",
    ),
  },
  {
    id: "mock-post-2",
    databaseId: 2,
    slug: "technical-seo-checklist-for-2026",
    title: "The Technical SEO Checklist for 2026",
    excerpt: "Placeholder excerpt for the second mock post.",
    content: "<p>Placeholder content.</p>",
    publishedAt: "2026-02-01T00:00:00.000Z",
    updatedAt: "2026-02-01T00:00:00.000Z",
    featuredImage: mockMedia,
    author: mockAuthor,
    categories: [mockCategories[1]],
    tags: [mockTags[1]],
    seo: buildMockSeo(
      "The Technical SEO Checklist for 2026",
      "Placeholder excerpt for the second mock post.",
      "article",
    ),
  },
];

function paginate(items: Post[], params?: { first?: number; after?: string }): Paginated<Post> {
  const first = params?.first ?? items.length;
  const paged = items.slice(0, first);

  return {
    items: paged,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: paged.length > 0 ? paged[0].id : null,
      endCursor: paged.length > 0 ? paged[paged.length - 1].id : null,
    },
    totalCount: items.length,
  };
}

export function getMockPosts(params?: { first?: number; after?: string }): Paginated<Post> {
  return paginate(mockPosts, params);
}

export function getMockPostBySlug(slug: string): Post | null {
  return mockPosts.find((post) => post.slug === slug) ?? null;
}

export function getMockPostsByCategory(
  categorySlug: string,
  params?: { first?: number; after?: string },
): Paginated<Post> {
  const filtered = mockPosts.filter((post) =>
    post.categories.some((category) => category.slug === categorySlug),
  );
  return paginate(filtered, params);
}

export function getMockPostsByTag(
  tagSlug: string,
  params?: { first?: number; after?: string },
): Paginated<Post> {
  const filtered = mockPosts.filter((post) => post.tags.some((tag) => tag.slug === tagSlug));
  return paginate(filtered, params);
}

export function getMockPostsBySearch(
  search: string,
  params?: { first?: number; after?: string },
): Paginated<Post> {
  const needle = search.trim().toLowerCase();
  const filtered = mockPosts.filter(
    (post) =>
      post.title.toLowerCase().includes(needle) || post.excerpt.toLowerCase().includes(needle),
  );
  return paginate(filtered, params);
}
