import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { buildPageOpenGraph } from "@/lib/seo/metadata";
import { ROUTES } from "@/constants/routes";
import { PageHero } from "@/components/common/PageHero";
import { GradientText } from "@/components/ui/GradientText";

export const metadata: Metadata = {
  title: "Thank You",
  description:
    "Thanks for reaching out — we'll get back to you within 24 hours.",
  alternates: { canonical: getCanonicalUrl(ROUTES.thankYou) },
  openGraph: buildPageOpenGraph(getCanonicalUrl(ROUTES.thankYou)),
  // A confirmation step, not content worth ranking or sharing on its own —
  // still fully reachable by direct navigation, just excluded from search
  // results and the sitemap's STATIC_ROUTES list.
  robots: { index: false, follow: true },
};

export default function ThankYouPage() {
  return (
    <PageHero
      eyebrow="MESSAGE SENT"
      heading={
        <>
          Thanks for reaching <GradientText>out.</GradientText>
        </>
      }
      description={[
        "We've received your message and will get back to you within 24 hours with a clear, actionable plan.",
      ]}
      buttons={[{ label: "Back to home", href: ROUTES.home }]}
      innerMaxWidth="max-w-2xl"
      descriptionMaxWidth="max-w-md"
    />
  );
}
