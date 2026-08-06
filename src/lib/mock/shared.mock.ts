import type { Media } from "@/types/domain/media";
import type { Author } from "@/types/domain/author";
import type { Category, Tag } from "@/types/domain/taxonomy";
import type { Seo } from "@/types/domain/seo";

export const mockMedia: Media = {
  id: "mock-media-1",
  // Next's image optimizer blocks placehold.co's default SVG response
  // (see next.config.ts) — .jpg keeps this a raster image.
  url: "https://placehold.co/1200x630.jpg",
  altText: "Placeholder image",
  width: 1200,
  height: 630,
};

export const mockAuthor: Author = {
  id: "mock-author-1",
  name: "Jane Doe",
  slug: "jane-doe",
  avatar: mockMedia,
  bio: "Placeholder author bio.",
};

export const mockCategories: Category[] = [
  { id: "mock-category-1", name: "Insights", slug: "insights", count: 1 },
  { id: "mock-category-2", name: "SEO", slug: "seo", count: 1 },
];

export const mockTags: Tag[] = [
  { id: "mock-tag-1", name: "Strategy", slug: "strategy" },
  { id: "mock-tag-2", name: "Growth", slug: "growth" },
];

export function buildMockSeo(
  title: string,
  description: string,
  type: Seo["openGraph"]["type"] = "website",
): Seo {
  return {
    title,
    description,
    canonicalUrl: null,
    openGraph: {
      title,
      description,
      image: mockMedia,
      type,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      image: mockMedia,
    },
    robots: { index: true, follow: true },
    jsonLd: null,
  };
}
