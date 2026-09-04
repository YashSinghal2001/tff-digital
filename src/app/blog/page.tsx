import type { Metadata } from "next";
import {
  getPosts,
  getPostsStrict,
  getPostsBySearchStrict,
} from "@/services/post.service";
import { getCategories, getTags } from "@/services/taxonomy.service";
import { BlogHero } from "@/sections/blog/BlogHero";
import { BlogResults } from "@/sections/blog/BlogResults";
import { BlogSidebar } from "@/components/blog/BlogSidebar";
import { NewsletterSection } from "@/components/blog/NewsletterSection";
import { Container } from "@/components/ui/Container";
import { JsonLd } from "@/components/common/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { buildPageOpenGraph } from "@/lib/seo/metadata";
import {
  firstSearchParam,
  type SearchParamValue,
} from "@/lib/routing/search-params";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Strategy, SEO, and performance marketing insights from the team building TFF Digital.",
  alternates: { canonical: getCanonicalUrl(ROUTES.blog) },
  openGraph: buildPageOpenGraph(getCanonicalUrl(ROUTES.blog)),
};

interface BlogPageProps {
  searchParams: Promise<{ q?: SearchParamValue; after?: SearchParamValue }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  // Both keys are normalized: a repeated `?q=a&q=b` or `?after=x&after=y`
  // arrives as an array and used to crash the render (SMOKE-2).
  const params = await searchParams;
  const query = firstSearchParam(params.q)?.trim() || undefined;
  const after = firstSearchParam(params.after);

  // Primary results are strict: a CMS failure surfaces as the route's error
  // boundary (5xx) instead of a 200 claiming "No articles yet" — that false
  // empty state is indexable and shipped live during the 2026-08 outage.
  // Sidebar data stays soft; it degrades to empty without taking the page down.
  const [result, categories, tags, sidebarPosts] = await Promise.all([
    query
      ? getPostsBySearchStrict(query, { first: 9, after })
      : getPostsStrict({ first: 9, after }),
    getCategories(),
    getTags(),
    getPosts({ first: 8 }),
  ]);

  const recentPosts = sidebarPosts.items.slice(0, 4);
  const popularPosts = sidebarPosts.items.slice(4, 8);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: getCanonicalUrl(ROUTES.home) },
          { name: "Blog", url: getCanonicalUrl(ROUTES.blog) },
        ])}
      />
      <BlogHero defaultQuery={query} />
      <section className="pb-12 lg:pb-16">
        <Container size="full" className="max-w-[1280px]">
          <div className="grid gap-10 lg:grid-cols-[1fr_300px]">
            <BlogResults
              posts={result.items}
              pageInfo={result.pageInfo}
              query={query}
              basePath={ROUTES.blog}
            />
            <aside className="lg:sticky lg:top-28 lg:h-fit">
              <BlogSidebar
                categories={categories}
                tags={tags}
                recentPosts={recentPosts}
                popularPosts={popularPosts}
                showSearch={false}
              />
            </aside>
          </div>
        </Container>
      </section>
      <NewsletterSection />
    </>
  );
}
