import type { Category, Tag } from "@/types/domain/taxonomy";
import { mockCategories, mockTags } from "@/lib/mock/shared.mock";

export function getMockCategories(): Category[] {
  return mockCategories;
}

export function getMockTags(): Tag[] {
  return mockTags;
}
