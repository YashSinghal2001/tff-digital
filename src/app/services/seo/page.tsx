import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { buildPageOpenGraph } from "@/lib/seo/metadata";
import { ROUTES } from "@/constants/routes";
import { SEOHero } from "@/sections/seo/SEOHero";
import { WhyYouNeedSEO } from "@/sections/seo/WhyYouNeedSEO";
import { SEOStrategy } from "@/sections/seo/SEOStrategy";
import { SEOServicesGrid } from "@/sections/seo/SEOServicesGrid";
import { FAQ } from "@/sections/shared/FAQ";
import { CTABookForm } from "@/sections/shared/CTABookForm";

export const metadata: Metadata = {
  title: "SEO",
  description:
    "SEO that compounds — technical foundations, content, and authority built to turn search into your most durable growth channel.",
  alternates: { canonical: getCanonicalUrl(ROUTES.service("seo")) },
  openGraph: buildPageOpenGraph(getCanonicalUrl(ROUTES.service("seo"))),
};

export default function SEOPage() {
  return (
    <>
      <SEOHero />
      <WhyYouNeedSEO />
      <SEOStrategy />
      <SEOServicesGrid />
      <FAQ />
      <CTABookForm />
    </>
  );
}
