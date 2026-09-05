import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";

/**
 * Rendered by the homepage and /services grids when the WordPress service
 * fetch yields nothing — a soft-failed CMS outage or no published services.
 * The grids used to read a hardcoded list that could never be empty; this is
 * the visible fallback that replaced it, so the section is never blank.
 */
export function ServicesEmptyState() {
  return (
    <Card className="mx-auto flex max-w-xl flex-col items-center gap-4 text-center">
      <p className="font-heading text-lg font-bold text-white">
        Our services list is being updated.
      </p>
      <p className="font-body text-muted text-sm">
        Tell us what you&apos;re working on and we&apos;ll map the right growth
        stack for you.
      </p>
      <Link href={ROUTES.contact} className={buttonVariants()}>
        Talk to us
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </Card>
  );
}
