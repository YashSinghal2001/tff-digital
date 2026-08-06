import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { ROUTES } from "@/constants/routes";
import { SMMHero } from "@/sections/smm/SMMHero";
import { WhyYouNeedSMM } from "@/sections/smm/WhyYouNeedSMM";
import { DestinationStrategy } from "@/sections/smm/DestinationStrategy";
import { PlatformSolutions } from "@/sections/smm/PlatformSolutions";
import { FAQ } from "@/sections/shared/FAQ";
import { CTABookForm } from "@/sections/shared/CTABookForm";

export const metadata: Metadata = {
  title: "Social Media Marketing",
  description:
    "Social media that builds brands, drives growth, and delivers results — strategy-led SMM across every platform that matters.",
  alternates: { canonical: getCanonicalUrl(ROUTES.service("smm")) },
};

export default function SMMPage() {
  return (
    <>
      <SMMHero />
      <WhyYouNeedSMM />
      <DestinationStrategy />
      <PlatformSolutions />
      <FAQ />
      <CTABookForm />
    </>
  );
}
