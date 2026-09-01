import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPosts, getPostsByCategory } from "@/services/post.service";
import {
  getCategories,
  getCategoriesStrict,
  getTags,
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

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ after?: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = (await getCategories()).find((item) => item.slug === slug);
  if (!category) return {};

  return {
    title: `${category.name} articles`,
    description: `Browse all articles in ${category.name}.`,
    alternates: { canonical: getCanonicalUrl(ROUTES.blogCategory(slug)) },
  };
}

export default async function BlogCategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { after } = await searchParams;

  // Strict: the category list doubles as the existence check for notFound()
  // below. The soft variant swallows a CMS outage into [], which turned every
  // live category URL into a wrong 404 — a de-indexing signal for a page that
  // exists. With strict, an outage hits the error boundary (5xx) instead.
  const [categories, tags, sidebarPosts] = await Promise.all([
    getCategoriesStrict(),
    getTags(),
    getPosts({ first: 8 }),
  ]);
  const category = categories.find((item) => item.slug === slug);
  if (!category) notFound();

  const result = await getPostsByCategory(slug, { first: 9, after });
  const recentPosts = sidebarPosts.items.slice(0, 4);
  const popularPosts = sidebarPosts.items.slice(4, 8);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: getCanonicalUrl(ROUTES.home) },
          { name: "Blog", url: getCanonicalUrl(ROUTES.blog) },
          { name: category.name, url: getCanonicalUrl(ROUTES.blogCategory(slug)) },
        ])}
      />
      <PageHero
        eyebrow="CATEGORY"
        heading={category.name}
        description={[`Browse all articles filed under ${category.name}.`]}
      />
      <section className="pb-16 lg:pb-24">
        <Container size="full" className="max-w-[1280px]">
          <Breadcrumbs
            items={[{ label: "Blog", href: ROUTES.blog }, { label: category.name }]}
            className="mb-8"
          />

          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
            <div>
              {result.items.length === 0 ? (
                <BlogEmptyState
                  title="No articles in this category yet"
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
                    <Pagination pageInfo={result.pageInfo} basePath={ROUTES.blogCategory(slug)} />
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
