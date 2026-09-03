"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();
  const [isRetrying, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // reset() alone re-renders the boundary from the same errored server
  // payload — for an error thrown in a Server Component (every CMS failure
  // on this site) that redisplays the error instantly without ever
  // re-attempting the fetch (audit OUTAGE-2, empirically confirmed: four
  // clicks produced zero new server requests). router.refresh() re-requests
  // the server render; reset() then clears the boundary once the fresh
  // payload arrives.
  const retry = () => {
    if (isRetrying) return;
    startTransition(() => {
      router.refresh();
      reset();
    });
  };

  return (
    <Container size="full" className="max-w-[1280px] py-24 text-center">
      <p className="mb-2 font-body text-xs tracking-[0.2em] text-primary">— ERROR</p>
      <Heading as="h1">Something went wrong.</Heading>
      <p className="mx-auto mt-4 max-w-md font-body text-sm text-muted">
        We hit an unexpected error loading this page. Try again, or head back home.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        {/* aria-disabled + the isRetrying guard, not the disabled attribute:
            a hard disable would drop keyboard focus to <body> mid-retry and
            hide the state change from screen readers (review finding). */}
        <button
          type="button"
          onClick={retry}
          aria-disabled={isRetrying}
          aria-busy={isRetrying}
          className={buttonVariants({ size: "md" })}
        >
          {isRetrying ? "Trying again…" : "Try again"}
        </button>
        <Link href={ROUTES.home} className={buttonVariants({ variant: "outline", size: "md" })}>
          Back to home
        </Link>
      </div>
    </Container>
  );
}
