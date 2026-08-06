import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { ROUTES } from "@/constants/routes";
import { getServiceOfferings } from "@/services/service-offering.service";
import { ServicesHero } from "@/sections/services/ServicesHero";
import { ServicesGrid } from "@/sections/services/ServicesGrid";
import { WhySeniorLed } from "@/sections/services/WhySeniorLed";
import { FAQ } from "@/sections/shared/FAQ";
import { CTABookForm } from "@/sections/shared/CTABookForm";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Nine disciplines, one growth engine — SEO, paid media, social, brand, and web, built to compound.",
  alternates: { canonical: getCanonicalUrl(ROUTES.services) },
};

export default async function ServicesPage() {
  const services = await getServiceOfferings();

  return (
    <>
      <ServicesHero />
      <ServicesGrid services={services.items} />
      <WhySeniorLed />
      <FAQ />
      <CTABookForm />
    </>
  );
}
