import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { BlogNotFound } from "@/components/blog/BlogNotFound";

// Without this, the segment had no metadata export at all, so it fell
// through to the root layout's bare site-name default title instead of
// signaling "not found" (META-1) — matching the root app/not-found.tsx and
// this route's own sibling category/tag not-found pages, which both already
// set a page-specific title.
export const metadata: Metadata = {
  title: "Article not found",
};

export default function NotFound() {
  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <BlogNotFound />
      </Container>
    </section>
  );
}
