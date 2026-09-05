import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getPageBySlug, getPages } from "@/services/content-page.service";
import { isReservedPageSlug } from "@/lib/content/reserved-page-slugs";
import { Container } from "@/components/ui/Container";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ArticleContent } from "@/components/blog/ArticleContent";
import { JsonLd } from "@/components/common/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { htmlToPlainText } from "@/lib/content/post-content";
import { ROUTES } from "@/constants/routes";

interface ContentPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Generic WordPress "Page" route (CLIENT-1) — renders whatever the client
 * publishes in wp-admin's Pages screen at its own slug, root-level, with no
 * prefix segment (matching WordPress's own default Page permalink shape).
 *
 * Reserved slugs — every existing static route this app owns, plus
 * portfolio/projects/work (kept unclaimed for the dormant Projects type,
 * ARCH-2) — are filtered out of the static params below and are never
 * fetched here even under the dynamicParams fallback, so a WordPress Page
 * can never shadow an existing route: see reserved-page-slugs.ts's own
 * comment for why this check is a second, independent guard on top of
 * Next's routing precedence rather than the only thing preventing it.
 *
 * Soft getPages(): a build-time CMS outage yields [] and the build still
 * succeeds; Page slugs then render on demand exactly as before
 * (dynamicParams stays on for Pages published between deploys) — the same
 * pattern PERF-1 established for services, mirrored here for Pages.
 */
export async function generateStaticParams() {
  const pages = await getPages();
  return pages.items
    .filter((page) => page.slug && !isReservedPageSlug(page.slug))
    .map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({
  params,
}: ContentPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (isReservedPageSlug(slug)) return {};

  let page;
  try {
    page = await getPageBySlug(slug);
  } catch {
    // Metadata must never be the reason a route dies: on a CMS failure fall
    // back to the site defaults and let the page component decide the
    // outcome.
    return {};
  }
  if (!page) return {};

  // Pages have no dedicated excerpt/summary field — fall back to the body
  // itself, stripped and capped to a conventional meta-description length,
  // rather than the sitewide default (which would be identical for every
  // Page with no Yoast description set).
  const description = page.content
    ? htmlToPlainText(page.content).slice(0, 160) || undefined
    : undefined;

  return buildMetadata(page.seo, getCanonicalUrl(ROUTES.page(slug)), {
    title: page.title,
    description,
  });
}

export default async function ContentPageRoute({ params }: ContentPageProps) {
  const { slug } = await params;
  if (isReservedPageSlug(slug)) notFound();

  // Lets a CMS outage surface as the route's error boundary (a 5xx) rather
  // than a wrong 404 — matches every other detail route's primary-content
  // resilience pattern.
  const page = await getPageBySlug(slug);
  if (!page) notFound();

  const canonicalUrl = getCanonicalUrl(ROUTES.page(slug));

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: getCanonicalUrl(ROUTES.home) },
          { name: page.title, url: canonicalUrl },
        ])}
      />

      <article className="py-10 lg:py-16">
        <Container size="full" className="max-w-[1280px]">
          <Breadcrumbs items={[{ label: page.title }]} className="mb-6" />

          <header className="mx-auto flex max-w-3xl flex-col items-center gap-4 text-center">
            <h1 className="font-heading text-[32px] leading-tight font-bold text-white sm:text-[44px]">
              {page.title}
            </h1>
          </header>

          {page.featuredImage ? (
            <div className="border-border-strong relative mx-auto mt-8 aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-[25px] border bg-white/5">
              <Image
                src={page.featuredImage.url}
                alt={page.featuredImage.altText || page.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
          ) : null}

          {page.content ? (
            <div className="mx-auto mt-10 max-w-3xl">
              <ArticleContent html={page.content} />
            </div>
          ) : null}
        </Container>
      </article>
    </>
  );
}
