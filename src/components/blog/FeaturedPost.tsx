import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/constants/routes";
import { getReadingTimeMinutes } from "@/lib/content/post-content";
import { formatPostDate } from "@/lib/content/format-date";
import type { Post } from "@/types/domain/post";

export interface FeaturedPostProps {
  post: Post;
}

export function FeaturedPost({ post }: FeaturedPostProps) {
  const readingTime = getReadingTimeMinutes(post.content);
  const category = post.categories[0];

  return (
    <Link
      href={ROUTES.blogPost(post.slug)}
      className="group grid gap-8 overflow-hidden rounded-[25px] border border-border-strong bg-glass outline-none focus-visible:ring-2 focus-visible:ring-primary/50 lg:grid-cols-2"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-white/5 lg:aspect-auto">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.altText || post.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : null}
      </div>

      <div className="flex flex-col justify-center gap-4 p-6 lg:p-10">
        <Badge tone="info" className="w-fit">
          Featured
        </Badge>
        {category ? <span className="font-body text-xs text-primary">{category.name}</span> : null}

        <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">{post.title}</h2>
        <p className="line-clamp-3 font-body text-sm text-muted">{post.excerpt}</p>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 font-body text-xs text-muted">
          {post.author ? <span>{post.author.name}</span> : null}
          {post.author ? <span aria-hidden="true">·</span> : null}
          <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
          <span aria-hidden="true">·</span>
          <span>{readingTime} min read</span>
        </div>

        <span className="mt-2 flex items-center gap-1 font-body text-sm font-semibold text-primary">
          Read article
          <span className="sr-only"> {post.title}</span>
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
