import type { ReactNode } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Heading } from "@/components/ui/Heading";
import { SectionEyebrow } from "@/components/common/SectionEyebrow";
import { buttonVariants } from "@/components/ui/button-variants";
import type { Variant } from "@/types/ui/common";
import { cn } from "@/lib/utils";

export interface PageHeroButton {
  label: string;
  href: string;
  variant?: Variant;
}

export interface PageHeroProps {
  eyebrow: string;
  heading: ReactNode;
  description: string[];
  buttons?: PageHeroButton[];
  trustedBy?: string[];
  badge?: string;
  innerMaxWidth?: string;
  descriptionMaxWidth?: string;
}

/**
 * No entrance animation on purpose: this renders the page's h1, which is
 * almost always the LCP element. Fading it in from opacity:0 delays paint
 * until Framer Motion's JS runs client-side — a well-known LCP regression.
 */
export function PageHero({
  eyebrow,
  heading,
  description,
  buttons,
  trustedBy,
  badge = "Premium Digital Growth Agency",
  innerMaxWidth = "max-w-3xl",
  descriptionMaxWidth = "max-w-xl",
}: PageHeroProps) {
  return (
    <section className="py-10 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <div className={cn("mx-auto flex flex-col items-center gap-6 text-center", innerMaxWidth)}>
          <Badge>
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {badge}
          </Badge>

          <SectionEyebrow className="mb-0">{eyebrow}</SectionEyebrow>

          <Heading as="h1">{heading}</Heading>

          {description.map((paragraph) => (
            <p key={paragraph} className={cn("font-body text-sm text-muted", descriptionMaxWidth)}>
              {paragraph}
            </p>
          ))}

          {buttons?.length ? (
            <div className="flex flex-wrap justify-center gap-4">
              {buttons.map((button) => (
                <Link
                  key={button.label}
                  href={button.href}
                  className={buttonVariants({ variant: button.variant ?? "primary", size: "md" })}
                >
                  {button.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>

        {trustedBy?.length ? (
          <div className="mt-16 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 border-t border-border-subtle pt-8">
            {trustedBy.map((brand) => (
              <span key={brand} className="font-heading text-sm font-semibold text-white/50">
                {brand}
              </span>
            ))}
          </div>
        ) : null}
      </Container>
    </section>
  );
}
