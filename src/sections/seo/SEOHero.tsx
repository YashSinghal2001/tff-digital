import { PageHero } from "@/components/common/PageHero";
import { GradientText } from "@/components/ui/GradientText";
import { ROUTES } from "@/constants/routes";

const trustedBy = ["Google", "Google Reviews", "Upwork", "Clutch"];

export function SEOHero() {
  return (
    <PageHero
      eyebrow="SEARCH ENGINE OPTIMIZATION"
      heading={
        <>
          SEO That <GradientText>Compounds. Rankings That Convert.</GradientText>
        </>
      }
      description={[
        "Paid traffic stops the moment you stop paying. Organic doesn't. We build technical foundations, content, and authority that keep compounding long after the work is done — turning search into your most durable growth channel.",
      ]}
      buttons={[
        { label: "Check Pricing", href: ROUTES.contact, variant: "outline" },
        { label: "Book Free Consultation", href: ROUTES.contact },
      ]}
      trustedBy={trustedBy}
    />
  );
}
