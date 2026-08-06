import type { Metadata } from "next";
import { getPosts, getPostsBySearch } from "@/services/post.service";
import { getCategories, getTags } from "@/services/taxonomy.service";
import { BlogHero } from "@/sections/blog/BlogHero";
import { BlogResults } from "@/sections/blog/BlogResults";
import { NewsletterSection } from "@/components/blog/NewsletterSection";
import { JsonLd } from "@/components/common/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Strategy, SEO, and performance marketing insights from the team building Target Find & Finish Digital.",
  alternates: { canonical: getCanonicalUrl(ROUTES.blog) },
};

interface BlogPageProps {
  searchParams: Promise<{ q?: string; after?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { q, after } = await searchParams;
  const query = q?.trim() || undefined;

  const [result, categories, tags] = await Promise.all([
    query ? getPostsBySearch(query, { first: 9, after }) : getPosts({ first: 9, after }),
    getCategories(),
    getTags(),
  ]);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: getCanonicalUrl(ROUTES.home) },
          { name: "Blog", url: getCanonicalUrl(ROUTES.blog) },
        ])}
      />
      <BlogHero defaultQuery={query} />
      <BlogResults
        posts={result.items}
        pageInfo={result.pageInfo}
        categories={categories}
        tags={tags}
        query={query}
        basePath={ROUTES.blog}
      />
      <NewsletterSection />
    </>
  );
}
