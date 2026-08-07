import { FeaturedPost } from "@/components/blog/FeaturedPost";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/blog/Pagination";
import { BlogEmptyState } from "@/components/blog/BlogEmptyState";
import type { Post } from "@/types/domain/post";
import type { PageInfo } from "@/types/domain/pagination";

export interface BlogResultsProps {
  posts: Post[];
  pageInfo: PageInfo;
  query?: string;
  basePath: string;
}

export function BlogResults({ posts, pageInfo, query, basePath }: BlogResultsProps) {
  if (posts.length === 0) {
    return (
      <BlogEmptyState
        title={query ? "No results found" : undefined}
        description={query ? `We couldn't find anything matching "${query}".` : undefined}
      />
    );
  }

  // Spotlight the top post only on the first, unfiltered page of results.
  const showFeatured = !query && !pageInfo.hasPreviousPage;
  const [featured, ...rest] = posts;
  const gridPosts = showFeatured ? rest : posts;

  return (
    <div>
      {showFeatured ? (
        <div className="mb-10">
          <FeaturedPost post={featured} />
        </div>
      ) : null}

      {gridPosts.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2">
          {gridPosts.map((post, index) => (
            <PostCard key={post.id} post={post} priority={!showFeatured && index === 0} />
          ))}
        </div>
      ) : null}

      <div className="mt-12">
        <Pagination
          pageInfo={pageInfo}
          basePath={basePath}
          searchParams={query ? { q: query } : undefined}
        />
      </div>
    </div>
  );
}
