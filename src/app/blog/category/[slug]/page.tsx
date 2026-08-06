import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostsByCategory } from "@/services/post.service";
import { getCategories } from "@/services/taxonomy.service";
import { PageHero } from "@/components/common/PageHero";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { PostCard } from "@/components/blog/PostCard";
import { Pagination } from "@/components/blog/Pagination";
import { BlogEmptyState } from "@/components/blog/BlogEmptyState";
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

  const category = (await getCategories()).find((item) => item.slug === slug);
  if (!category) notFound();

  const result = await getPostsByCategory(slug, { first: 9, after });

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

          {result.items.length === 0 ? (
            <BlogEmptyState
              title="No articles in this category yet"
              description="Check back soon — we're publishing new content regularly."
            />
          ) : (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {result.items.map((post, index) => (
                  <PostCard key={post.id} post={post} priority={index === 0} />
                ))}
              </div>
              <div className="mt-12">
                <Pagination pageInfo={result.pageInfo} basePath={ROUTES.blogCategory(slug)} />
              </div>
            </>
          )}
        </Container>
      </section>
    </>
  );
}
