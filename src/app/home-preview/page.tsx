import type { Metadata } from "next";
import { getServiceOfferings } from "@/services/service-offering.service";
import { getCaseStudies } from "@/services/case-study.service";
import { toServiceCardItems } from "@/lib/content/service-cards";
import { filterPlaceholderCaseStudies } from "@/lib/content/case-study-placeholders";
import { HeroSection } from "@/sections/home/HeroSection";
import { TrustedBrands } from "@/sections/home/TrustedBrands";
import { WhatWeDo } from "@/sections/home/WhatWeDo";
import { WhyTFF } from "@/sections/shared/WhyTFF";
import { HowWeWork } from "@/sections/home/HowWeWork";
import { AboutJourney } from "@/sections/home/AboutJourney";
import { SelectedWork } from "@/sections/home/SelectedWork";
import { Testimonials } from "@/sections/home/Testimonials";
import { WhoThisIsFor } from "@/sections/shared/WhoThisIsFor";
import { NotSureYet } from "@/sections/home/NotSureYet";
import { StatementBand } from "@/sections/shared/StatementBand";
import { GradientText } from "@/components/ui/GradientText";
import { Industries } from "@/sections/home/Industries";
import { FAQ } from "@/sections/shared/FAQ";
import { CTABookForm } from "@/sections/shared/CTABookForm";
import { RichText } from "@/components/common/RichText";
import {
  homePreviewComparison,
  homePreviewFaq,
  homePreviewFinalCta,
  homePreviewFit,
  homePreviewFounders,
  homePreviewHero,
  homePreviewProcess,
  homePreviewServiceCopy,
  homePreviewTestimonials,
  homePreviewWhatWeDo,
} from "@/data/home-preview-content";

// Staging copy of the homepage (src/app/page.tsx) carrying the client's
// approved homepage PDF copy. Public (no auth) but noindex/nofollow,
// absent from the sitemap and navigation, and emits
// no page-level JSON-LD so it can't compete with the real homepage's
// Breadcrumb/FAQPage nodes. Same sections, same order, same styling as `/`;
// only copy props differ — plus the ThreePartJourney cards are dropped
// (they duplicate HowWeWork's six steps).

const HOMEPAGE_FEATURE_LIMIT = 3;

export const metadata: Metadata = {
  title: "Homepage Preview",
  robots: { index: false, follow: false },
};

export default async function HomePreview() {
  const [services, caseStudies] = await Promise.all([
    getServiceOfferings({ first: 100 }),
    getCaseStudies({ first: 20 }),
  ]);

  const featuredCaseStudies = filterPlaceholderCaseStudies(caseStudies.items)
    .filter((caseStudy) => caseStudy.featuredOnHomepage)
    .slice(0, 4)
    .map(({ seo: _seo, ...caseStudy }) => caseStudy);

  // Card links, order and icons stay WordPress-driven; only the copy of the
  // six services the PDF covers is swapped. Unknown slugs keep their WP copy.
  const serviceCards = toServiceCardItems(services.items, {
    featureLimit: HOMEPAGE_FEATURE_LIMIT,
  }).map((card) => ({ ...card, ...homePreviewServiceCopy[card.slug] }));

  return (
    <>
      <div className="flex flex-col lg:min-h-[calc(100svh-6rem)]">
        <HeroSection
          heading={
            <>
              {homePreviewHero.headline}{" "}
              <GradientText>{homePreviewHero.headlineEmphasis}</GradientText>
            </>
          }
          intro={homePreviewHero.intro}
        />
        <TrustedBrands />
      </div>
      <WhatWeDo
        services={serviceCards}
        clampSummary={false}
        heading={
          <>
            {homePreviewWhatWeDo.heading}
            <br />
            <GradientText>{homePreviewWhatWeDo.headingEmphasis}</GradientText>
          </>
        }
      />
      <WhyTFF
        heading={
          <>
            {homePreviewComparison.heading}{" "}
            <GradientText>{homePreviewComparison.headingEmphasis}</GradientText>
          </>
        }
        intro={homePreviewComparison.intro}
      />
      <StatementBand support="Every quarter should make the next one easier. That's what a growth system is for.">
        Strategy sets the direction.{" "}
        <GradientText>Execution compounds it.</GradientText>
      </StatementBand>
      <HowWeWork
        heading={
          <>
            {homePreviewProcess.heading}{" "}
            <GradientText>{homePreviewProcess.headingEmphasis}</GradientText>{" "}
            {homePreviewProcess.headingTail}
          </>
        }
        intro={homePreviewProcess.intro}
      />
      <AboutJourney
        showJourney={false}
        heading={
          <>
            {homePreviewFounders.heading}{" "}
            <GradientText>{homePreviewFounders.headingEmphasis}</GradientText>
          </>
        }
        intro={<RichText parts={homePreviewFounders.intro} />}
      />
      <SelectedWork caseStudies={featuredCaseStudies} />
      <Testimonials
        heading={
          <>
            {homePreviewTestimonials.heading}{" "}
            <GradientText>
              {homePreviewTestimonials.headingEmphasis}
            </GradientText>
          </>
        }
        intro={homePreviewTestimonials.caption}
        excerpts={
          <ul className="mx-auto mt-6 flex max-w-md flex-col gap-2">
            {homePreviewTestimonials.excerpts.map((excerpt) => (
              <li key={excerpt.testimonialId}>
                <blockquote className="font-body text-sm text-white italic">
                  &ldquo;{excerpt.quote}&rdquo;
                </blockquote>
              </li>
            ))}
          </ul>
        }
      />
      <WhoThisIsFor
        heading={homePreviewFit.heading}
        description={homePreviewFit.intro}
      />
      <NotSureYet />
      <Industries />
      <FAQ
        heading={
          <>
            {homePreviewFaq.heading}{" "}
            <GradientText>{homePreviewFaq.headingEmphasis}</GradientText>
          </>
        }
        items={homePreviewFaq.items.map(({ question, answer }) => ({
          question,
          answer: <RichText parts={answer} />,
        }))}
      />
      <StatementBand>
        Growth isn&apos;t luck.{" "}
        <GradientText>It&apos;s a system, built deliberately.</GradientText>
      </StatementBand>
      <CTABookForm
        heading={
          <>
            {homePreviewFinalCta.heading}{" "}
            <GradientText>{homePreviewFinalCta.headingEmphasis}</GradientText>
          </>
        }
        intro={homePreviewFinalCta.intro}
      />
    </>
  );
}
