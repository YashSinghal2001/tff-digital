import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { buildPageOpenGraph } from "@/lib/seo/metadata";
import { ROUTES } from "@/constants/routes";
import { ContactHero } from "@/sections/contact/ContactHero";
import { ContactFormSection } from "@/sections/contact/ContactFormSection";
import { FAQ } from "@/sections/shared/FAQ";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Let's talk growth — tell us about your goals and we'll get back to you within 24 hours.",
  alternates: { canonical: getCanonicalUrl(ROUTES.contact) },
  openGraph: buildPageOpenGraph(getCanonicalUrl(ROUTES.contact)),
};

export default function ContactPage() {
  return (
    <>
      <ContactHero />
      <ContactFormSection />
      <FAQ />
    </>
  );
}
