import type { PortfolioItem } from "@/types/domain/portfolio-item";
import type { Paginated } from "@/types/domain/pagination";
import {
  buildMockSeo,
  mockCategories,
  mockMedia,
} from "@/lib/mock/shared.mock";

export const mockPortfolioItems: PortfolioItem[] = [
  {
    id: "mock-portfolio-1",
    slug: "acme-rebrand",
    title: "Acme Rebrand",
    summary: "Placeholder summary for the Acme rebrand project.",
    content: "<p>Placeholder content.</p>",
    client: "Acme Co.",
    featuredImage: mockMedia,
    gallery: [mockMedia],
    categories: mockCategories,
    seo: buildMockSeo(
      "Acme Rebrand",
      "Placeholder summary for the Acme rebrand project.",
    ),
  },
];

export function getMockPortfolioItems(): Paginated<PortfolioItem> {
  return {
    items: mockPortfolioItems,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
    totalCount: mockPortfolioItems.length,
  };
}

export function getMockPortfolioItemBySlug(slug: string): PortfolioItem | null {
  return mockPortfolioItems.find((item) => item.slug === slug) ?? null;
}
