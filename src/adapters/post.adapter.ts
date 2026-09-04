import type { WPPost } from "@/types/api/wp-post";
import type { Post } from "@/types/domain/post";
import { adaptMedia } from "@/adapters/media.adapter";
import { adaptSeo } from "@/adapters/seo.adapter";
import { adaptAuthor } from "@/adapters/author.adapter";
import { adaptCategory, adaptTag } from "@/adapters/taxonomy.adapter";
import { stripHtml } from "@/lib/content/post-content";
import { sanitizeWpHtml } from "@/lib/content/sanitize-wp-html";

export function adaptPost(wpPost: WPPost): Post {
  // WPGraphQL returns null (not "") for excerpt/content on posts with no
  // body text, even though the schema types them as non-null strings.
  // The raw excerpt also carries markup (e.g. "<p>...</p>") — strip it so
  // post cards render plain text instead of literal tags.
  const excerpt = stripHtml(wpPost.excerpt ?? "").replace(/\s+/g, " ").trim();
  // Body HTML reaches ArticleContent's dangerouslySetInnerHTML — sanitize at
  // the boundary (ARCH-5) so a compromised wp-admin can't become stored XSS.
  const content = sanitizeWpHtml(wpPost.content ?? "");

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
    categories: wpPost.categories?.nodes?.map(adaptCategory) ?? [],
    tags: wpPost.tags?.nodes?.map(adaptTag) ?? [],
    seo: adaptSeo(wpPost.seo, {
      title: wpPost.title,
      description: excerpt,
    }),
  };
}
