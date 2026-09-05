import type { ServiceOffering } from "@/types/domain/service-offering";
import type { Paginated } from "@/types/domain/pagination";
import { buildMockSeo, mockMedia } from "@/lib/mock/shared.mock";

export const mockServiceOfferings: ServiceOffering[] = [
  {
    id: "mock-service-1",
    slug: "brand-strategy",
    title: "Brand Strategy",
    summary: "Placeholder summary for brand strategy.",
    content: "<p>Placeholder content.</p>",
    publishedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    icon: mockMedia,
    featuredImage: mockMedia,
    order: 1,
    features: ["Positioning", "Messaging", "Visual identity"],
    seo: buildMockSeo(
      "Brand Strategy",
      "Placeholder summary for brand strategy.",
    ),
  },
  {
    id: "mock-service-2",
    slug: "web-development",
    title: "Web Development",
    summary: "Placeholder summary for web development.",
    content: "<p>Placeholder content.</p>",
    publishedAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    icon: mockMedia,
    featuredImage: mockMedia,
    order: 2,
    features: ["Responsive build", "Performance", "CMS integration"],
    seo: buildMockSeo(
      "Web Development",
      "Placeholder summary for web development.",
    ),
  },
];

export function getMockServiceOfferings(): Paginated<ServiceOffering> {
  return {
    items: mockServiceOfferings,
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
      endCursor: null,
    },
    totalCount: mockServiceOfferings.length,
  };
}

export function getMockServiceOfferingBySlug(
  slug: string,
): ServiceOffering | null {
  return mockServiceOfferings.find((service) => service.slug === slug) ?? null;
}

// Mock stand-in for WordPress's numeric post ID, so the preview redirect
// route's databaseId → slug resolution is exercisable in local/mock dev —
// mirrors case-studies.mock.ts's identical helper. Index-based (id 1 =
// first fixture), not a real WP convention.
export function getMockServiceOfferingPreviewByDatabaseId(
  id: number,
): ServiceOffering | null {
  return mockServiceOfferings[id - 1] ?? null;
}
