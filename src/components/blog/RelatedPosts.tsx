import { Heading } from "@/components/ui/Heading";
import { PostCard } from "@/components/blog/PostCard";
import type { Post } from "@/types/domain/post";

export interface RelatedPostsProps {
  posts: Post[];
}

export function RelatedPosts({ posts }: RelatedPostsProps) {
  if (posts.length === 0) return null;

  return (
    <section aria-labelledby="related-posts-heading" className="border-t border-border-subtle pt-12">
      <Heading as="h2" id="related-posts-heading" className="mb-6 text-2xl">
        Related articles
      </Heading>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  );
}
