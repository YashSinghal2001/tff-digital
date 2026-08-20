import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Heading } from "@/components/ui/Heading";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <Container size="full" className="max-w-[1280px] py-24 text-center">
      <p className="mb-2 font-body text-xs tracking-[0.2em] text-primary">— 404</p>
      <Heading as="h1">Page not found.</Heading>
      <p className="mx-auto mt-4 max-w-md font-body text-sm text-muted">
        The page you&apos;re looking for may have been moved or no longer exists.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <Link href={ROUTES.home} className={buttonVariants({ size: "md" })}>
          Back to home
        </Link>
        <Link href={ROUTES.blog} className={buttonVariants({ variant: "outline", size: "md" })}>
          Visit the blog
        </Link>
      </div>
    </Container>
  );
}
