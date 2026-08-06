"use client";

import { useEffect } from "react";
import Link from "next/link";
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
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Container size="full" className="max-w-[1280px] py-24 text-center">
      <p className="mb-2 font-body text-xs tracking-[0.2em] text-primary">— ERROR</p>
      <Heading as="h1">Something went wrong.</Heading>
      <p className="mx-auto mt-4 max-w-md font-body text-sm text-muted">
        We hit an unexpected error loading this page. Try again, or head back home.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <button type="button" onClick={reset} className={buttonVariants({ size: "md" })}>
          Try again
        </button>
        <Link href={ROUTES.home} className={buttonVariants({ variant: "outline", size: "md" })}>
          Back to home
        </Link>
      </div>
    </Container>
  );
}
