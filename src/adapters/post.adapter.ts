import type { WPPost } from "@/types/api/wp-post";
import type { Post } from "@/types/domain/post";
import { adaptMedia } from "@/adapters/media.adapter";
import { adaptSeo } from "@/adapters/seo.adapter";
import { adaptAuthor } from "@/adapters/author.adapter";
import { adaptCategory, adaptTag } from "@/adapters/taxonomy.adapter";

export function adaptPost(wpPost: WPPost): Post {
  return {
    id: wpPost.id,
    databaseId: wpPost.databaseId,
    slug: wpPost.slug,
    title: wpPost.title,
    excerpt: wpPost.excerpt,
    content: wpPost.content,
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
      description: wpPost.excerpt,
    }),
  };
}
