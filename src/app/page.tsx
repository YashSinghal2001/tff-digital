import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { buildPageOpenGraph } from "@/lib/seo/metadata";
import { seoConfig } from "@/config/seo.config";
import { ROUTES } from "@/constants/routes";
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

// The compact five-column What We Do card only has room for a short list;
// /services renders every feature. Applied before the client boundary.
const HOMEPAGE_FEATURE_LIMIT = 3;

export const metadata: Metadata = {
  // Next's title.template (root layout) never applies to app/page.tsx, since
  // it's the same route segment as app/layout.tsx that defines the template
  // — so this must spell out the site name explicitly, or the homepage
  // <title> renders as the bare string below with no brand name at all.
  title: `${seoConfig.defaultTitle} | Digital Growth Agency`,
  description:
    "TFF Digital is a strategy-led digital growth agency driving measurable growth through SEO, digital marketing, web development, and performance marketing.",
  alternates: { canonical: getCanonicalUrl(ROUTES.home) },
  openGraph: buildPageOpenGraph(getCanonicalUrl(ROUTES.home)),
};

export default async function Home() {
  // Both fetches are soft: the homepage must render even when the CMS is
  // down. Services arrive in display_order (service layer); the cap mirrors
  // the detail route's generateStaticParams so a newly published service is
  // never silently dropped. Selected Work shows the WordPress case studies
  // whose "Featured on homepage" field is ticked (newest first, max 4) and
  // falls back to its designed empty state — never invented content — while
  // none are published.
  const [services, caseStudies] = await Promise.all([
    getServiceOfferings({ first: 100 }),
    getCaseStudies({ first: 20 }),
  ]);

  // `seo` is dropped here, not just excluded from SelectedWork's prop type:
  // types are erased at runtime, so the field has to actually leave the object
  // to stay out of the serialized client payload (SEO-2). The homepage's own
  // crawlable JSON-LD is built separately and is unaffected.
  const featuredCaseStudies = filterPlaceholderCaseStudies(caseStudies.items)
    .filter((caseStudy) => caseStudy.featuredOnHomepage)
    .slice(0, 4)
    .map(({ seo: _seo, ...caseStudy }) => caseStudy);

  return (
    <>
      {/* Hero + Upwork trust bar form one first-screen composition: the
          wrapper fills the viewport below the fixed navbar (main pt-24 = 6rem)
          and the hero flexes to absorb the remaining height. */}
      <div className="flex flex-col lg:min-h-[calc(100svh-6rem)]">
        <HeroSection />
        <TrustedBrands />
      </div>
      <WhatWeDo
        services={toServiceCardItems(services.items, {
          featureLimit: HOMEPAGE_FEATURE_LIMIT,
        })}
      />
      <WhyTFF />
      <StatementBand support="Every quarter should make the next one easier. That's what a growth system is for.">
        Strategy sets the direction.{" "}
        <GradientText>Execution compounds it.</GradientText>
      </StatementBand>
      <HowWeWork />
      <AboutJourney />
      <SelectedWork caseStudies={featuredCaseStudies} />
      <Testimonials />
      <WhoThisIsFor />
      <NotSureYet />
      <Industries />
      <FAQ />
      <StatementBand>
        Growth isn&apos;t luck.{" "}
        <GradientText>It&apos;s a system, built deliberately.</GradientText>
      </StatementBand>
      <CTABookForm />
    </>
  );
}
