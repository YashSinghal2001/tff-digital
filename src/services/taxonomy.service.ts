import "server-only";
import { wordpressConfig } from "@/config/wordpress.config";
import { findAllCategories, findAllTags } from "@/repositories/taxonomy.repository";
import { adaptCategory, adaptTag } from "@/adapters/taxonomy.adapter";
import { getMockCategories, getMockTags } from "@/lib/mock/taxonomy.mock";
import type { Category, Tag } from "@/types/domain/taxonomy";

/**
 * Throwing variant: a WPGraphQL failure propagates. Use where an empty list
 * would be MISREAD as "this taxonomy term doesn't exist" — the category/tag
 * routes' existence checks 404 on a miss, and an outage must surface as a
 * 5xx there, never as a 404 that could get a real archive page de-indexed.
 */
export async function getCategoriesStrict(): Promise<Category[]> {
  if (wordpressConfig.useMockData) {
    return getMockCategories();
  }

  const { categories } = await findAllCategories();
  return categories.nodes.map(adaptCategory);
}

export async function getCategories(): Promise<Category[]> {
  try {
    return await getCategoriesStrict();
  } catch (error) {
    // Soft variant for sidebars/filters: a live WPGraphQL outage would
    // otherwise take down any page that merely decorates itself with the
    // category list, matching getServiceOfferings' resilience pattern.
    console.error(
      "[getCategories] WPGraphQL request failed; rendering without live categories for this build.",
      error,
    );
    return [];
  }
}

/** Throwing variant of getTags — see getCategoriesStrict for when. */
export async function getTagsStrict(): Promise<Tag[]> {
  if (wordpressConfig.useMockData) {
    return getMockTags();
  }

  const { tags } = await findAllTags();
  return tags.nodes.map(adaptTag);
}

export async function getTags(): Promise<Tag[]> {
  try {
    return await getTagsStrict();
  } catch (error) {
    console.error(
      "[getTags] WPGraphQL request failed; rendering without live tags for this build.",
      error,
    );
    return [];
  }
}
