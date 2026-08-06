import type { WPCategory, WPTag } from "@/types/api/wp-taxonomy";
import type { Category, Tag } from "@/types/domain/taxonomy";

export function adaptCategory(wpCategory: WPCategory): Category {
  return {
    id: wpCategory.id,
    name: wpCategory.name,
    slug: wpCategory.slug,
    count: wpCategory.count ?? 0,
  };
}

export function adaptTag(wpTag: WPTag): Tag {
  return {
    id: wpTag.id,
    name: wpTag.name,
    slug: wpTag.slug,
  };
}
