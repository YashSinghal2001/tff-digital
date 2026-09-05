import type { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/seo/canonical";
import { buildPageOpenGraph } from "@/lib/seo/metadata";
import { ROUTES } from "@/constants/routes";
import { getServiceOfferings } from "@/services/service-offering.service";
import { toServiceCardItems } from "@/lib/content/service-cards";
import { ServicesHero } from "@/sections/services/ServicesHero";
import { TrustedBrands } from "@/sections/home/TrustedBrands";
import { ServicesGrid } from "@/sections/services/ServicesGrid";
import { WhySeniorLed } from "@/sections/services/WhySeniorLed";
import { WhoThisIsFor } from "@/sections/shared/WhoThisIsFor";
import { FAQ, type FAQItem } from "@/sections/shared/FAQ";
import { CTABookForm } from "@/sections/shared/CTABookForm";

const servicesFitItems = [
  "You want one accountable partner across strategy, brand, and performance",
  "You're ready to invest consistently, not sporadically",
  "You want senior operators in the room, not account managers",
  "You care where every dollar goes — and expect reporting to match",
];

const servicesNotFitItems = [
  "You're looking for a one-off, lowest-bid deliverable",
  "You expect guarantees no honest agency can make",
  "You want activity reports instead of revenue outcomes",
  "You already have all the answers and just need hands",
];

const servicesFaqs: FAQItem[] = [
  {
    question: "Can we start with just one service?",
    answer:
      "Yes. Every service works on its own. Most clients start with a single engagement, then plug in more of the stack once the results and reporting speak for themselves.",
  },
  {
    question: "How do you decide what to recommend?",
    answer:
      "We start from your goals and your current funnel, not from what's easiest to sell. If a service won't move revenue for you, we'll say so.",
  },
  {
    question: "Who actually works on our account?",
    answer:
      "Senior operators. Every account is led by someone with a decade of experience — we don't hand you off to juniors.",
  },
  {
    question: "How do you report on results?",
    answer:
      "Live dashboards and honest reporting tied to revenue. We only measure what moves the P&L — not vanity metrics.",
  },
  {
    question: "How quickly will I see results?",
    answer:
      "Most clients see early signal within the first 30-60 days, with compounding results building over the first two quarters.",
  },
];

export const metadata: Metadata = {
  title: "Services",
  description:
    "Six disciplines, one growth engine — SEO, paid media, social, brand, and web, built to compound.",
  alternates: { canonical: getCanonicalUrl(ROUTES.services) },
  openGraph: buildPageOpenGraph(getCanonicalUrl(ROUTES.services)),
};

export default async function ServicesPage() {
  // Soft fetch (empty on a CMS outage, never a failed build), already in
  // display_order; the cap mirrors the detail route's generateStaticParams so
  // a newly published service is never silently dropped.
  const services = await getServiceOfferings({ first: 100 });
  return (
    <>
      <ServicesHero />
      <TrustedBrands />
      <ServicesGrid services={toServiceCardItems(services.items)} />
      <WhySeniorLed />
      <WhoThisIsFor
        eyebrow="WHO WE WORK WITH"
        heading="Great work starts with the right fit."
        description="Six disciplines, one filter: whether we can genuinely move your revenue."
        fitItems={servicesFitItems}
        notFitItems={servicesNotFitItems}
      />
      <FAQ items={servicesFaqs} />
      <CTABookForm />
    </>
  );
}
