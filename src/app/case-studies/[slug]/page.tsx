import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { getCaseStudies, getCaseStudyBySlug } from "@/services/case-study.service";
import {
  filterPlaceholderCaseStudies,
  isPlaceholderCaseStudySlug,
} from "@/lib/content/case-study-placeholders";
import type { CaseStudy } from "@/types/domain/case-study";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { buttonVariants } from "@/components/ui/button-variants";
import { Breadcrumbs } from "@/components/blog/Breadcrumbs";
import { ArticleContent } from "@/components/blog/ArticleContent";
import { ResultsGrid } from "@/components/case-studies/ResultsGrid";
import { RelatedServices } from "@/sections/case-studies/RelatedServices";
import { JsonLd } from "@/components/common/JsonLd";
import { buildCaseStudyJsonLd, buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { htmlToPlainText } from "@/lib/content/post-content";
import { ROUTES } from "@/constants/routes";

interface CaseStudyPageProps {
  params: Promise<{ slug: string }>;
}

// Prerender every published WordPress case study — the same filtered set the
// listing and sitemap use — so ISR keeps serving the last good HTML through a
// CMS outage. Soft getCaseStudies: a build-time outage yields [] and the
// build still succeeds; slugs then render on demand (dynamicParams stays on,
// so case studies published between deploys work immediately).
export async function generateStaticParams() {
  const caseStudies = await getCaseStudies({ first: 100 });
  return filterPlaceholderCaseStudies(caseStudies.items).map((caseStudy) => ({
    slug: caseStudy.slug,
  }));
}

export async function generateMetadata({ params }: CaseStudyPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (isPlaceholderCaseStudySlug(slug)) return {};
  let caseStudy: CaseStudy | null;
  try {
    caseStudy = await getCaseStudyBySlug(slug);
  } catch {
    // Metadata must never be the reason a route dies: on a CMS failure fall
    // back to the site defaults and let the page component decide the outcome.
    return {};
  }
  if (!caseStudy) return {};

  // Content-derived fallback so a case study without Yoast data still gets
  // its own title/description instead of the site defaults.
  const summary = caseStudy.summary || caseStudy.excerpt;
  return buildMetadata(caseStudy.seo, getCanonicalUrl(ROUTES.caseStudy(slug)), {
    title: caseStudy.title,
    description: summary ? htmlToPlainText(summary) : undefined,
  });
}

export default async function CaseStudyPage({ params }: CaseStudyPageProps) {
  const { slug } = await params;
  // Throwaway CMS entries (e.g. "test") are hidden from the listing and
  // sitemap — 404 them here too so the URL can't be reached directly.
  if (isPlaceholderCaseStudySlug(slug)) notFound();
  // getCaseStudyBySlug distinguishes "missing" (null → 404) from "CMS
  // failed" (throw → error boundary, a 5xx) — a temporary outage must never
  // become a wrong 404 that could get real content de-indexed.
  const caseStudy = await getCaseStudyBySlug(slug);
  if (!caseStudy) notFound();

  const canonicalUrl = getCanonicalUrl(ROUTES.caseStudy(slug));

  return (
    <>
      <JsonLd
        data={[
          buildCaseStudyJsonLd(caseStudy, canonicalUrl),
          buildBreadcrumbJsonLd([
            { name: "Home", url: getCanonicalUrl(ROUTES.home) },
            { name: "Case Studies", url: getCanonicalUrl(ROUTES.caseStudies) },
            { name: caseStudy.title, url: canonicalUrl },
          ]),
        ]}
      />

      <article className="py-10 lg:py-16">
        <Container size="full" className="max-w-[1280px]">
          <Breadcrumbs
            items={[
              { label: "Case Studies", href: ROUTES.caseStudies },
              { label: caseStudy.title },
            ]}
            className="mb-6"
          />

          <header className="mx-auto flex max-w-3xl flex-col gap-4 text-center">
            {caseStudy.industry ? (
              <div className="flex flex-wrap justify-center gap-2">
                <Badge tone="info">{caseStudy.industry}</Badge>
              </div>
            ) : null}

            <h1 className="font-heading text-[32px] font-bold leading-tight text-white sm:text-[44px]">
              {caseStudy.title}
            </h1>

            {caseStudy.summary ? (
              <p className="mx-auto max-w-xl font-body text-sm text-muted">{caseStudy.summary}</p>
            ) : null}

            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-body text-sm text-muted">
              {caseStudy.clientName ? <span>{caseStudy.clientName}</span> : null}
              {caseStudy.clientName && caseStudy.projectUrl ? (
                <span aria-hidden="true">·</span>
              ) : null}
              {caseStudy.projectUrl ? (
                <Link
                  href={caseStudy.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Visit project
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              ) : null}
            </div>
          </header>

          {caseStudy.featuredImage ? (
            <div className="relative mx-auto mt-8 aspect-[16/9] w-full max-w-5xl overflow-hidden rounded-[25px] border border-border-strong bg-white/5">
              <Image
                src={caseStudy.featuredImage.url}
                alt={caseStudy.featuredImage.altText || caseStudy.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
                className="object-cover"
              />
            </div>
          ) : null}

          <div className="mx-auto mt-10 max-w-5xl">
            <ResultsGrid results={caseStudy.results} />
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-10 sm:grid-cols-2">
            {caseStudy.challenge ? (
              <div>
                <Heading as="h2" className="mb-4 text-2xl">
                  The Challenge
                </Heading>
                <ArticleContent html={caseStudy.challenge} />
              </div>
            ) : null}
            {caseStudy.solution ? (
              <div>
                <Heading as="h2" className="mb-4 text-2xl">
                  The Solution
                </Heading>
                <ArticleContent html={caseStudy.solution} />
              </div>
            ) : null}
          </div>

          <RelatedServices services={caseStudy.relatedServices} />

          <div className="mx-auto mt-16 max-w-5xl text-center">
            <Link href={ROUTES.contact} className={buttonVariants({ size: "md" })}>
              Start your growth story
            </Link>
          </div>
        </Container>
      </article>
    </>
  );
}
