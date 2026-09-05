import { PageHero } from "@/components/common/PageHero";
import { GradientText } from "@/components/ui/GradientText";
import { ROUTES } from "@/constants/routes";

export function ServicesHero() {
  return (
    <PageHero
      eyebrow="SERVICES"
      heading={
        <>
          Six disciplines. <GradientText>One growth engine.</GradientText>
        </>
      }
      description={[
        "Every service is built to compound. Buy one, or plug in the whole stack — we're purpose-built to integrate.",
      ]}
      buttons={[
        { label: "Book Free Consultation", href: ROUTES.contact },
        { label: "Explore Services", href: `${ROUTES.services}#grid`, variant: "outline" },
      ]}
    />
  );
}
