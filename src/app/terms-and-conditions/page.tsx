import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { buildPageOpenGraph } from "@/lib/seo/metadata";
import { ROUTES } from "@/constants/routes";
import { LegalHero } from "@/sections/legal/LegalHero";
import { TermsBody } from "@/sections/legal/TermsBody";

const EFFECTIVE_DATE = "August 9, 2026";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "The terms and conditions governing your use of the TFF Digital website at tffdigital.com.",
  alternates: { canonical: getCanonicalUrl(ROUTES.termsAndConditions) },
  openGraph: buildPageOpenGraph(getCanonicalUrl(ROUTES.termsAndConditions)),
};

export default function TermsAndConditionsPage() {
  return (
    <>
      <LegalHero
        heading="Terms & Conditions"
        intro="These Terms and Conditions govern your access to and use of the TFF Digital website at tffdigital.com."
        effectiveDate={EFFECTIVE_DATE}
        lastUpdated={EFFECTIVE_DATE}
      />
      <TermsBody />
    </>
  );
}
