import type { ContentPage } from "@/types/domain/content-page";
import { buildMockSeo, mockMedia } from "@/lib/mock/shared.mock";

export const mockPages: ContentPage[] = [
  {
    id: "mock-page-home",
    slug: "home",
    title: "Home",
    content: "<p>Placeholder homepage content.</p>",
    featuredImage: mockMedia,
    seo: buildMockSeo("Home", "Placeholder homepage description."),
  },
  {
    id: "mock-page-about",
    slug: "about",
    title: "About",
    content: "<p>Placeholder about content.</p>",
    featuredImage: mockMedia,
    seo: buildMockSeo("About", "Placeholder about description."),
  },
  {
    id: "mock-page-contact",
    slug: "contact",
    title: "Contact",
    content: "<p>Placeholder contact content.</p>",
    featuredImage: null,
    seo: buildMockSeo("Contact", "Placeholder contact description."),
  },
];

export function getMockPageBySlug(slug: string): ContentPage | null {
  return mockPages.find((page) => page.slug === slug) ?? null;
}
