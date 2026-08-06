import { PageHero } from "@/components/common/PageHero";
import { GradientText } from "@/components/ui/GradientText";
import { ROUTES } from "@/constants/routes";

export function AboutHero() {
  return (
    <PageHero
      eyebrow="ABOUT US"
      heading={
        <>
          We&apos;re operators <GradientText>disguised as an agency.</GradientText>
        </>
      }
      description={[
        "Target Find Finish exists because ambitious brands deserve a growth partner that thinks like them, ships like them, and wins with them.",
      ]}
      buttons={[
        { label: "Book Free Consultation", href: ROUTES.contact },
        { label: "Explore Services", href: ROUTES.services, variant: "outline" },
      ]}
    />
  );
}
