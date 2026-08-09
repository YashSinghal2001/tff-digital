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

  try {
    const { categories } = await findAllCategories();
    return categories.nodes.map(adaptCategory);
  } catch (error) {
    // A live WPGraphQL outage would otherwise throw here and take down any
    // page that renders a category filter/sidebar, matching
    // getServiceOfferings' resilience pattern.
    console.error(
      "[getCategories] WPGraphQL request failed; rendering without live categories for this build.",
      error,
    );
    return [];
  }
}

export async function getTags(): Promise<Tag[]> {
  if (wordpressConfig.useMockData) {
    return getMockTags();
  }

  try {
    const { tags } = await findAllTags();
    return tags.nodes.map(adaptTag);
  } catch (error) {
    console.error(
      "[getTags] WPGraphQL request failed; rendering without live tags for this build.",
      error,
    );
    return [];
  }
}
