import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostBySlug, getPostsByCategory } from "@/services/post.service";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { AuthorCard } from "@/components/blog/AuthorCard";
import { ArticleContent } from "@/components/blog/ArticleContent";
import { TableOfContents } from "@/components/blog/TableOfContents";
import { ShareButtons } from "@/components/blog/ShareButtons";
import { ReadingTime } from "@/components/blog/ReadingTime";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { JsonLd } from "@/components/common/JsonLd";
import { buildBlogPostingJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { withHeadingIds } from "@/lib/content/post-content";
import { formatPostDate } from "@/lib/content/format-date";
import { ROUTES } from "@/constants/routes";

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  return buildMetadata(post.seo, {
    alternates: { canonical: getCanonicalUrl(ROUTES.blogPost(slug)) },
  });
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const { html, headings } = withHeadingIds(post.content);
  const canonicalUrl = getCanonicalUrl(ROUTES.blogPost(slug));

  const primaryCategory = post.categories[0];
  const related = primaryCategory
    ? (await getPostsByCategory(primaryCategory.slug, { first: 4 })).items
        .filter((item) => item.id !== post.id)
        .slice(0, 3)
    : [];

  return (
    <>
      <JsonLd
        data={[
          buildBlogPostingJsonLd(post),
          buildBreadcrumbJsonLd([
            { name: "Home", url: getCanonicalUrl(ROUTES.home) },
            { name: "Blog", url: getCanonicalUrl(ROUTES.blog) },
            { name: post.title, url: canonicalUrl },
          ]),
        ]}
      />

      <article className="py-10 lg:py-16">
        <Container size="full" className="max-w-[1280px]">
          <Breadcrumbs
            items={[{ label: "Blog", href: ROUTES.blog }, { label: post.title }]}
            className="mb-6"
          />

          <header className="mx-auto flex max-w-3xl flex-col gap-4">
            {post.categories.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {post.categories.map((category) => (
                  <Badge key={category.id} tone="info">
                    {category.name}
                  </Badge>
                ))}
              </div>
            ) : null}

            <h1 className="font-heading text-[32px] font-bold leading-tight text-white sm:text-[44px]">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-sm text-muted">
              {post.author ? <span>{post.author.name}</span> : null}
              {post.author ? <span aria-hidden="true">·</span> : null}
              <time dateTime={post.publishedAt}>{formatPostDate(post.publishedAt)}</time>
              <span aria-hidden="true">·</span>
              <ReadingTime content={post.content} />
            </div>

            <ShareButtons url={canonicalUrl} title={post.title} />
          </header>

          <div className="mx-auto mt-10 grid max-w-5xl gap-10 lg:grid-cols-[1fr_260px]">
            {/* Visually hidden: guarantees h1 -> h2 order even when the post
                body has no h2 of its own and there are no related posts to
                supply one (both render their own real h2/h3 when present). */}
            <h2 className="sr-only">Article content</h2>
            <ArticleContent html={html} className="mx-auto w-full max-w-3xl" />

            <aside className="flex flex-col gap-6 lg:sticky lg:top-28 lg:h-fit">
              <TableOfContents headings={headings} />
              {post.author ? <AuthorCard author={post.author} /> : null}
            </aside>
          </div>

          {related.length > 0 ? (
            <div className="mx-auto mt-16 max-w-5xl">
              <RelatedPosts posts={related} />
            </div>
          ) : null}
        </Container>
      </article>
    </>
  );
}
