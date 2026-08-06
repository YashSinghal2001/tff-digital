import type { WPAuthorNode } from "@/types/api/wp-author";
import type { Author } from "@/types/domain/author";

export function adaptAuthor(wpAuthor: WPAuthorNode): Author {
  return {
    id: wpAuthor.id,
    name: wpAuthor.name,
    slug: wpAuthor.slug,
    avatar: wpAuthor.avatar
      ? {
          id: `${wpAuthor.id}-avatar`,
          url: wpAuthor.avatar.url,
          altText: wpAuthor.name,
          width: null,
          height: null,
        }
      : null,
    bio: wpAuthor.description,
  };
}
