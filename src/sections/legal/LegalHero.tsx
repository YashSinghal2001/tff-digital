import { PageHero } from "@/components/common/PageHero";

export interface LegalHeroProps {
  heading: string;
  intro: string;
  effectiveDate: string;
  lastUpdated: string;
}

export function LegalHero({ heading, intro, effectiveDate, lastUpdated }: LegalHeroProps) {
  return (
    <PageHero
      eyebrow="LEGAL"
      heading={heading}
      description={[intro, `Effective Date: ${effectiveDate} · Last Updated: ${lastUpdated}`]}
      innerMaxWidth="max-w-2xl"
      descriptionMaxWidth="max-w-xl"
    />
  );
}
