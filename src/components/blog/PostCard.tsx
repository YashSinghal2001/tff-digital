import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/constants/routes";
import { getReadingTimeMinutes } from "@/lib/content/post-content";
import { formatPostDate } from "@/lib/content/format-date";
import type { Post } from "@/types/domain/post";
import { cn } from "@/lib/utils";

export interface PostCardProps {
  post: Post;
  className?: string;
  priority?: boolean;
}

export function PostCard({ post, className, priority = false }: PostCardProps) {
  const readingTime = getReadingTimeMinutes(post.content);
  const category = post.categories[0];

  return (
    <Link
      href={ROUTES.blogPost(post.slug)}
      // The whole card is one link, so its computed name would concatenate
      // badge, title, excerpt, author, date, and reading time (CARDA11Y-1).
      aria-label={post.title}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-[25px] border border-border-strong bg-glass transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
        className,
      )}
    >
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-white/5">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.altText || post.title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        {category ? (
          <Badge tone="info" className="w-fit">
            {category.name}
          </Badge>
        ) : null}

        <h3 className="line-clamp-2 font-heading text-lg font-bold text-white">{post.title}</h3>
        <p className="line-clamp-2 font-body text-sm text-muted">{post.excerpt}</p>

        <div className="mt-auto flex flex-wrap items-center gap-x-2 gap-y-1 pt-2 font-body text-xs text-muted">
          {post.author ? <span>{post.author.name}</span> : null}
          {post.author ? <span aria-hidden="true">·</span> : null}
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{readingTime} min read</span>
        </div>
      </div>
    </Link>
  );
}
