import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { buildPageOpenGraph } from "@/lib/seo/metadata";
import { ROUTES } from "@/constants/routes";
import { LegalHero } from "@/sections/legal/LegalHero";
import { CookiePolicyBody } from "@/sections/legal/CookiePolicyBody";

const EFFECTIVE_DATE = "September 5, 2026";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description:
    "How TFF Digital uses cookies and browser storage on tffdigital.com, and how you can manage them.",
  alternates: { canonical: getCanonicalUrl(ROUTES.cookiePolicy) },
  openGraph: buildPageOpenGraph(getCanonicalUrl(ROUTES.cookiePolicy)),
};

export default function CookiePolicyPage() {
  return (
    <>
      <LegalHero
        heading="Cookie Policy"
        intro="This Cookie Policy explains how TFF Digital uses cookies and browser storage when you visit tffdigital.com."
        effectiveDate={EFFECTIVE_DATE}
        lastUpdated={EFFECTIVE_DATE}
      />
      <CookiePolicyBody />
    </>
  );
}
