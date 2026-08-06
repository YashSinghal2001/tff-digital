import { PageHero } from "@/components/common/PageHero";
import { GradientText } from "@/components/ui/GradientText";
import { ROUTES } from "@/constants/routes";

const trustedBy = ["Google", "Google Reviews", "Upwork", "Clutch"];

export function SMMHero() {
  return (
    <PageHero
      eyebrow="SOCIAL MEDIA MARKETING"
      heading={
        <>
          Social Media That{" "}
          <GradientText>Builds Brands. Drives Growth. Delivers Results.</GradientText>
        </>
      }
      description={[
        "At Target Find Finish Digital, we don't just manage social media — we build growth systems that connect your brand with the right audience, create meaningful engagement, and turn “follows” into measurable business results.",
        "Whether you're looking to increase brand awareness, generate qualified leads, or build a loyal community, our data-driven social media strategies are designed to help your business grow with purpose.",
      ]}
      buttons={[
        { label: "Check Pricing", href: ROUTES.contact, variant: "outline" },
        { label: "Book Free Consultation", href: ROUTES.contact },
      ]}
      trustedBy={trustedBy}
    />
  );
}
