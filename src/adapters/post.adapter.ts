import type { WPPost } from "@/types/api/wp-post";
import type { Post } from "@/types/domain/post";
import { adaptMedia } from "@/adapters/media.adapter";
import { adaptSeo } from "@/adapters/seo.adapter";
import { adaptAuthor } from "@/adapters/author.adapter";
import { adaptCategory, adaptTag } from "@/adapters/taxonomy.adapter";

export function adaptPost(wpPost: WPPost): Post {
  // WPGraphQL returns null (not "") for excerpt/content on posts with no
  // body text, even though the schema types them as non-null strings.
  const excerpt = wpPost.excerpt ?? "";
  const content = wpPost.content ?? "";

  return {
    id: wpPost.id,
    databaseId: wpPost.databaseId,
    slug: wpPost.slug,
    title: wpPost.title,
    excerpt,
    content,
    publishedAt: wpPost.date,
    updatedAt: wpPost.modified,
    featuredImage: wpPost.featuredImage
      ? adaptMedia(wpPost.featuredImage.node)
      : null,
    author: wpPost.author ? adaptAuthor(wpPost.author.node) : null,
    categories: wpPost.categories?.nodes.map(adaptCategory) ?? [],
    tags: wpPost.tags?.nodes.map(adaptTag) ?? [],
    seo: adaptSeo(wpPost.seo, {
      title: wpPost.title,
      description: excerpt,
    }),
  };
}
