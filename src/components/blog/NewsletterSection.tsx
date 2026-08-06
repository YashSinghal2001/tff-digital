"use client";

import { useState, type FormEvent } from "react";
import { Mail } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { GradientText } from "@/components/ui/GradientText";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * UI only — there is no newsletter CPT/endpoint in the WordPress
 * architecture yet (only Leads, wired in src/features/contact). Submitting
 * just shows a local confirmation state; wire this to a real subscribe
 * endpoint when one exists, mirroring the Contact form's Server Action
 * pattern in src/features/contact/actions.ts.
 */
export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubscribed(true);
    setEmail("");
  };

  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <div className="flex flex-col items-center gap-4 rounded-[25px] border border-border-strong bg-glass p-10 text-center sm:p-14">
          <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border-strong bg-glass text-primary">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="font-heading text-2xl font-bold text-white sm:text-3xl">
            Get growth insights in your <GradientText>inbox.</GradientText>
          </h2>
          <p className="max-w-md font-body text-sm text-muted">
            One email a month — no spam, just the strategies that are actually moving the needle.
          </p>

          {subscribed ? (
            <p role="status" className="font-body text-sm font-semibold text-primary">
              You&apos;re subscribed — thanks for joining.
            </p>
          ) : (
            <form
              onSubmit={onSubmit}
              className="flex w-full max-w-md flex-col gap-3 pt-2 sm:flex-row"
            >
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className={cn(
                  "w-full rounded-full border border-border-strong bg-glass px-5 py-2.5 font-body text-sm text-white placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
                )}
              />
              <Button type="submit" className="shrink-0">
                Subscribe
              </Button>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}
