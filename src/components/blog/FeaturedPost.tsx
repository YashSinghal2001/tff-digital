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
      // The whole card is one link, so its computed name would concatenate the
      // Featured badge, category, title, excerpt, author, date, reading time
      // and the "Read article" affordance — 533 characters as measured on the
      // live blog listing (CARDA11Y-1). Same title-only name as PostCard.
      aria-label={post.title}
      className="group border-border-strong bg-glass focus-visible:ring-primary/50 grid gap-8 overflow-hidden rounded-[25px] border outline-none focus-visible:ring-2 lg:grid-cols-2"
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-white/5 lg:aspect-auto">
        {post.featuredImage ? (
          <Image
            src={post.featuredImage.url}
            alt={post.featuredImage.altText || post.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : null}
      </div>

      <div className="flex flex-col justify-center gap-4 p-6 lg:p-10">
        <Badge tone="info" className="w-fit">
          Featured
        </Badge>
        {category ? (
          <span className="font-body text-primary text-xs">
            {category.name}
          </span>
        ) : null}

        <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
          {post.title}
        </h2>
        <p className="font-body text-muted line-clamp-3 text-sm">
          {post.excerpt}
        </p>

        <div className="font-body text-muted flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          {post.author ? <span>{post.author.name}</span> : null}
          {post.author ? <span aria-hidden="true">·</span> : null}
          <time dateTime={post.publishedAt}>
            {formatPostDate(post.publishedAt)}
          </time>
          <span aria-hidden="true">·</span>
          <span>{readingTime} min read</span>
        </div>

        {/* The link's aria-label already names the card with the post title,
            so this affordance no longer carries a screen-reader-only copy of
            it (that suffix could never be reached through the label). */}
        <span className="font-body text-primary mt-2 flex items-center gap-1 text-sm font-semibold">
          Read article
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
