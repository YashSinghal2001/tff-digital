"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ROUTES } from "@/constants/routes";
import { buttonVariants } from "@/components/ui/button-variants";
import {
  getCookieConsent,
  setCookieConsent,
  type CookieConsentDecision,
} from "@/lib/consent/cookie-consent";

/**
 * Sitewide cookie notice (CLIENT-5). The site loads no analytics or
 * advertising scripts, so there is nothing to gate behind this decision —
 * "Accept" and "Reject" both just record that the visitor dismissed the
 * notice (see src/lib/consent/cookie-consent.ts and /cookie-policy).
 *
 * Renders nothing until the stored decision has been checked client-side,
 * so it never flashes for a returning visitor and never renders twice.
 */
export function CookieConsentBanner() {
  const [decision, setDecision] = useState<
    CookieConsentDecision | null | undefined
  >(undefined);

  useEffect(() => {
    setDecision(getCookieConsent());
  }, []);

  if (decision === undefined || decision !== null) return null;

  const decide = (next: CookieConsentDecision) => {
    setCookieConsent(next);
    setDecision(next);
  };

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className="border-border-strong bg-background/95 fixed inset-x-0 bottom-0 z-50 border-t px-4 py-4 backdrop-blur sm:px-6"
    >
      <div className="mx-auto flex max-w-[1280px] flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="font-body text-muted text-sm leading-relaxed">
          We use only strictly necessary technology to run this site — no
          analytics or advertising cookies. See our{" "}
          <Link
            href={ROUTES.cookiePolicy}
            className="text-primary underline underline-offset-2"
          >
            Cookie Policy
          </Link>{" "}
          to learn more.
        </p>

        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => decide("rejected")}
            className={buttonVariants({ variant: "outline", size: "sm" })}
          >
            Reject
          </button>
          <button
            type="button"
            onClick={() => decide("accepted")}
            className={buttonVariants({ variant: "primary", size: "sm" })}
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
