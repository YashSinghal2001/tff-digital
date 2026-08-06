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
    icon: mockMedia,
    featuredImage: mockMedia,
    order: 1,
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
    icon: mockMedia,
    featuredImage: mockMedia,
    order: 2,
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
