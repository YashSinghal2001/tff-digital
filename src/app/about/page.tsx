import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { ROUTES } from "@/constants/routes";
import { AboutHero } from "@/sections/about/AboutHero";
import { OurStory } from "@/sections/about/OurStory";
import { Values } from "@/sections/about/Values";
import { Team } from "@/sections/about/Team";
import { OurCulture } from "@/sections/about/OurCulture";
import { OurPhilosophy } from "@/sections/about/OurPhilosophy";
import { WhyTFF } from "@/sections/shared/WhyTFF";
import { FAQ } from "@/sections/shared/FAQ";

export const metadata: Metadata = {
  title: "About",
  description:
    "We're operators disguised as an agency — meet the team building TFF Digital.",
  alternates: { canonical: getCanonicalUrl(ROUTES.about) },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />
      <OurStory />
      <Values />
      <Team />
      <OurCulture />
      <OurPhilosophy />
      <WhyTFF />
      <FAQ />
    </>
  );
}
