import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { ROUTES } from "@/constants/routes";
import { LegalHero } from "@/sections/legal/LegalHero";
import { PrivacyPolicyBody } from "@/sections/legal/PrivacyPolicyBody";

const EFFECTIVE_DATE = "August 9, 2026";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How TFF Digital collects, uses, and protects information when you visit tffdigital.com.",
  alternates: { canonical: getCanonicalUrl(ROUTES.privacyPolicy) },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <LegalHero
        heading="Privacy Policy"
        intro="This Privacy Policy explains how TFF Digital collects, uses, and protects information when you visit tffdigital.com."
        effectiveDate={EFFECTIVE_DATE}
        lastUpdated={EFFECTIVE_DATE}
      />
      <PrivacyPolicyBody />
    </>
  );
}
