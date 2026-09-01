import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPosts, getPostsByTag } from "@/services/post.service";
import {
  getCategories,
  getTags,
  getTagsStrict,
} from "@/services/taxonomy.service";
import { PageHero } from "@/components/common/PageHero";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/blog/Pagination";
import { BlogEmptyState } from "@/components/blog/BlogEmptyState";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { JsonLd } from "@/components/common/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { ROUTES } from "@/constants/routes";

interface TagPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ after?: string }>;
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = (await getTags()).find((item) => item.slug === slug);
  if (!tag) return {};

  return {
    title: `#${tag.name} articles`,
    description: `Browse all articles tagged ${tag.name}.`,
    alternates: { canonical: getCanonicalUrl(ROUTES.blogTag(slug)) },
  };
}

export default async function BlogTagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params;
  const { after } = await searchParams;

  // Strict: the tag list doubles as the existence check for notFound() below —
  // same wrong-404-on-outage fix as the category route (see its comment).
  const [categories, tags, sidebarPosts] = await Promise.all([
    getCategories(),
    getTagsStrict(),
    getPosts({ first: 8 }),
  ]);
  const tag = tags.find((item) => item.slug === slug);
  if (!tag) notFound();

  const result = await getPostsByTag(slug, { first: 9, after });
  const recentPosts = sidebarPosts.items.slice(0, 4);
  const popularPosts = sidebarPosts.items.slice(4, 8);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: getCanonicalUrl(ROUTES.home) },
          { name: "Blog", url: getCanonicalUrl(ROUTES.blog) },
          { name: `#${tag.name}`, url: getCanonicalUrl(ROUTES.blogTag(slug)) },
        ])}
      />
      <PageHero
        eyebrow="TAG"
        heading={`#${tag.name}`}
        description={[`Browse all articles tagged ${tag.name}.`]}
      />
      <section className="pb-16 lg:pb-24">
        <Container size="full" className="max-w-[1280px]">
          <Breadcrumbs
            items={[{ label: "Blog", href: ROUTES.blog }, { label: `#${tag.name}` }]}
            className="mb-8"
          />

          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
            <div>
              {result.items.length === 0 ? (
                <BlogEmptyState
                  title="No articles with this tag yet"
                  description="Check back soon — we're publishing new content regularly."
                />
              ) : (
                <>
                  <div className="grid gap-6 sm:grid-cols-2">
                    {result.items.map((post, index) => (
                      <PostCard key={post.id} post={post} priority={index === 0} />
                    ))}
                  </div>
                  <div className="mt-12">
                    <Pagination pageInfo={result.pageInfo} basePath={ROUTES.blogTag(slug)} />
                  </div>
                </>
              )}
            </div>
            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <BlogSidebar
                categories={categories}
                tags={tags}
                recentPosts={recentPosts}
                popularPosts={popularPosts}
              />
            </aside>
          </div>
        </Container>
      </section>
    </>
  );
}
