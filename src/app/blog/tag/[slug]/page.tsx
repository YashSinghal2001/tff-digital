import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPostsByTag } from "@/services/post.service";
import { getTags } from "@/services/taxonomy.service";
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

  const tag = (await getTags()).find((item) => item.slug === slug);
  if (!tag) notFound();

  const result = await getPostsByTag(slug, { first: 9, after });

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

          {result.items.length === 0 ? (
            <BlogEmptyState
              title="No articles with this tag yet"
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
                <Pagination pageInfo={result.pageInfo} basePath={ROUTES.blogTag(slug)} />
              </div>
            </>
          )}
        </Container>
      </section>
    </>
  );
}
