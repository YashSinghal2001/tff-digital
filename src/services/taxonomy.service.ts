import "server-only";
import { wordpressConfig } from "@/config/wordpress.config";
import { findAllCategories, findAllTags } from "@/repositories/taxonomy.repository";
import { adaptCategory, adaptTag } from "@/adapters/taxonomy.adapter";
import { getMockCategories, getMockTags } from "@/lib/mock/taxonomy.mock";
import type { Category, Tag } from "@/types/domain/taxonomy";

export async function getCategories(): Promise<Category[]> {
  if (wordpressConfig.useMockData) {
    return getMockCategories();
  }

  const { categories } = await findAllCategories();
  return categories.nodes.map(adaptCategory);
}

export async function getTags(): Promise<Tag[]> {
  if (wordpressConfig.useMockData) {
    return getMockTags();
  }

  const { tags } = await findAllTags();
  return tags.nodes.map(adaptTag);
}
