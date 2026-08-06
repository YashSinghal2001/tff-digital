import { PageHero } from "@/components/common/PageHero";
import { GradientText } from "@/components/ui/GradientText";

export function ContactHero() {
  return (
    <PageHero
      eyebrow="CONTACT"
      heading={
        <>
          Let&apos;s talk <GradientText>growth.</GradientText>
        </>
      }
      description={[
        "Tell us about your goals and we'll get back to you within 24 hours with a clear, actionable plan.",
      ]}
      innerMaxWidth="max-w-2xl"
      descriptionMaxWidth="max-w-md"
    />
  );
}
