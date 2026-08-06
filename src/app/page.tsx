import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { ROUTES } from "@/constants/routes";
import { HeroSection } from "@/sections/home/HeroSection";
import { TrustedBrands } from "@/sections/home/TrustedBrands";
import { WhatWeDo } from "@/sections/home/WhatWeDo";
import { WhyTFF } from "@/sections/shared/WhyTFF";
import { HowWeWork } from "@/sections/home/HowWeWork";
import { AboutJourney } from "@/sections/home/AboutJourney";
import { SelectedWork } from "@/sections/home/SelectedWork";
import { Testimonials } from "@/sections/home/Testimonials";
import { Industries } from "@/sections/home/Industries";
import { FAQ } from "@/sections/shared/FAQ";
import { CTABookForm } from "@/sections/shared/CTABookForm";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Target Find & Finish Digital — strategy, branding, and performance marketing built to compound.",
  alternates: { canonical: getCanonicalUrl(ROUTES.home) },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <TrustedBrands />
      <WhatWeDo />
      <WhyTFF />
      <HowWeWork />
      <AboutJourney />
      <SelectedWork />
      <Testimonials />
      <Industries />
      <FAQ />
      <CTABookForm />
    </>
  );
}
