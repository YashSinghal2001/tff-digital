import type { Metadata } from "next";
import { getCaseStudiesStrict } from "@/services/case-study.service";
import { filterPlaceholderCaseStudies } from "@/lib/content/case-study-placeholders";
import { PageHero } from "@/components/common/PageHero";
import { Container } from "@/components/ui/Container";
import { Pagination } from "@/components/blog/Pagination";
import { EmptyState } from "@/components/common/EmptyState";
import { CaseStudyCard } from "@/sections/case-studies/CaseStudyCard";
import { JsonLd } from "@/components/common/JsonLd";
import { buildBreadcrumbJsonLd } from "@/lib/seo/json-ld";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import {
  firstSearchParam,
  type SearchParamValue,
} from "@/lib/routing/search-params";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Case Studies",
  description: "Real client results — the growth systems we've built and the numbers they earned.",
  alternates: { canonical: getCanonicalUrl(ROUTES.caseStudies) },
};

interface CaseStudiesPageProps {
  searchParams: Promise<{ after?: SearchParamValue }>;
}

export default async function CaseStudiesPage({ searchParams }: CaseStudiesPageProps) {
  // A repeated `?after=x&after=y` used to reach the GraphQL String variable as
  // an array, failing the strict fetch below into a 500 (SMOKE-2).
  const after = firstSearchParam((await searchParams).after);
  // Strict: case studies are this page's PRIMARY content, so a CMS failure
  // surfaces as the route's error boundary (5xx) instead of a 200 claiming
  // "No case studies yet" — the same strict/soft split as the blog listing.
  const result = await getCaseStudiesStrict({ first: 9, after });
  const caseStudyItems = filterPlaceholderCaseStudies(result.items);

  return (
    <>
      <JsonLd
        data={buildBreadcrumbJsonLd([
          { name: "Home", url: getCanonicalUrl(ROUTES.home) },
          { name: "Case Studies", url: getCanonicalUrl(ROUTES.caseStudies) },
        ])}
      />
      <PageHero
        eyebrow="CASE STUDIES"
        heading="Growth, made visible."
        description={["A glimpse at the systems we've built and the results they've earned."]}
      />
      <section className="pb-12 lg:pb-16">
        <Container size="full" className="max-w-[1280px]">
          {caseStudyItems.length === 0 ? (
            <EmptyState
              title="No case studies yet"
              description="Check back soon — we're publishing new client results regularly."
            />
          ) : (
            <>
              {/* Visually hidden: keeps h1 -> h3 card titles in valid heading order, matching the same pattern used in ServicesGrid.tsx. */}
              <h2 className="sr-only">Case studies</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {caseStudyItems.map((caseStudy, index) => (
                  <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} priority={index === 0} />
                ))}
              </div>
              <div className="mt-12">
                <Pagination pageInfo={result.pageInfo} basePath={ROUTES.caseStudies} />
              </div>
            </>
          )}
        </Container>
      </section>
    </>
  );
}
