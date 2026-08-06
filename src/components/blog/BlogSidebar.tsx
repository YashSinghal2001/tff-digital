import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { BlogSearch } from "@/components/blog/BlogSearch";
import { ROUTES } from "@/constants/routes";
import { formatPostDate } from "@/lib/content/format-date";
import type { Post } from "@/types/domain/post";
import type { Category, Tag } from "@/types/domain/taxonomy";
import { cn } from "@/lib/utils";

export interface BlogSidebarProps {
  categories: Category[];
  tags: Tag[];
  recentPosts: Post[];
  popularPosts: Post[];
  showSearch?: boolean;
  defaultQuery?: string;
  className?: string;
}

const cardClass = "rounded-[25px] border border-border-strong bg-glass p-6";
const cardTitleClass = "mb-4 font-heading text-xs font-bold uppercase tracking-wide text-white";

function SidebarPostRow({ post }: { post: Post }) {
  return (
    <Link href={ROUTES.blogPost(post.slug)} className="group flex items-center gap-3">
      <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-border-strong bg-white/5">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.altText || post.title}
            fill
            sizes="56px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
      </span>
      <span className="flex flex-col gap-0.5">
        <span className="line-clamp-2 font-body text-sm font-medium text-white transition-colors group-hover:text-primary">
          {post.title}
        </span>
        <time dateTime={post.publishedAt} className="font-body text-xs text-muted">
          {formatPostDate(post.publishedAt)}
        </time>
      </span>
    </Link>
  );
}

/**
 * "Popular posts" has no analytics source wired up yet, so it renders a
 * distinct slice of recent posts as an honest placeholder rather than
 * duplicating the "Recent posts" list — swap the source once view/engagement
 * tracking exists.
 */
export function BlogSidebar({
  categories,
  tags,
  recentPosts,
  popularPosts,
  showSearch = true,
  defaultQuery,
  className,
}: BlogSidebarProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {showSearch ? (
        <div className={cardClass}>
          <p className={cardTitleClass}>Search</p>
          <BlogSearch defaultValue={defaultQuery} />
        </div>
      ) : null}

      {categories.length > 0 ? (
        <div className={cardClass}>
          <p className={cardTitleClass}>Categories</p>
          <ul className="flex flex-col gap-2.5">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  href={ROUTES.blogCategory(category.slug)}
                  className="flex items-center justify-between font-body text-sm text-muted transition-colors hover:text-white"
                >
                  <span>{category.name}</span>
                  <span className="text-xs text-muted">{category.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {recentPosts.length > 0 ? (
        <div className={cardClass}>
          <p className={cardTitleClass}>Recent posts</p>
          <div className="flex flex-col gap-4">
            {recentPosts.map((post) => (
              <SidebarPostRow key={post.id} post={post} />
            ))}
          </div>
        </div>
      ) : null}

      {popularPosts.length > 0 ? (
        <div className={cardClass}>
          <p className={cardTitleClass}>Popular posts</p>
          <p className="mb-4 -mt-2 font-body text-xs text-muted">
            Ranked by reader activity once analytics is connected — showing recent picks for now.
          </p>
          <div className="flex flex-col gap-4">
            {popularPosts.map((post) => (
              <SidebarPostRow key={post.id} post={post} />
            ))}
          </div>
        </div>
      ) : null}

      {tags.length > 0 ? (
        <div className={cardClass}>
          <p className={cardTitleClass}>Tags</p>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Link key={tag.id} href={ROUTES.blogTag(tag.slug)}>
                <Badge className="transition-colors hover:border-primary/50 hover:text-primary">
                  #{tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
