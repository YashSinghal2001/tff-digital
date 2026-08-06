import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { FeaturedPost } from "@/components/blog/FeaturedPost";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/blog/Pagination";
import { BlogEmptyState } from "@/components/blog/BlogEmptyState";
import { ROUTES } from "@/constants/routes";
import type { Post } from "@/types/domain/post";
import type { PageInfo } from "@/types/domain/pagination";
import type { Category, Tag } from "@/types/domain/taxonomy";

export interface BlogResultsProps {
  posts: Post[];
  pageInfo: PageInfo;
  categories: Category[];
  tags: Tag[];
  query?: string;
  basePath: string;
}

export function BlogResults({ posts, pageInfo, categories, tags, query, basePath }: BlogResultsProps) {
  if (posts.length === 0) {
    return (
      <section className="pb-16 lg:pb-24">
        <Container size="full" className="max-w-[1280px]">
          <BlogEmptyState
            title={query ? "No results found" : undefined}
            description={query ? `We couldn't find anything matching "${query}".` : undefined}
          />
        </Container>
      </section>
    );
  }

  // Spotlight the top post only on the first, unfiltered page of results.
  const showFeatured = !query && !pageInfo.hasPreviousPage;
  const [featured, ...rest] = posts;
  const gridPosts = showFeatured ? rest : posts;

  return (
    <section className="pb-16 lg:pb-24">
      <Container size="full" className="max-w-[1280px]">
        {categories.length > 0 || tags.length > 0 ? (
          <div className="mb-10 flex flex-wrap items-center gap-2">
            {categories.map((category) => (
              <Link key={category.id} href={ROUTES.blogCategory(category.slug)}>
                <Badge className="transition-colors hover:border-primary/50 hover:text-primary">
                  {category.name}
                </Badge>
              </Link>
            ))}
            {tags.map((tag) => (
              <Link key={tag.id} href={ROUTES.blogTag(tag.slug)}>
                <Badge className="transition-colors hover:border-primary/50 hover:text-primary">
                  #{tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        ) : null}

        {showFeatured ? (
          <div className="mb-10">
            <FeaturedPost post={featured} />
          </div>
        ) : null}

        {gridPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post, index) => (
              <PostCard key={post.id} post={post} priority={index === 0} />
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
      </Container>
    </section>
  );
}
