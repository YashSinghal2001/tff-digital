import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { BlogNotFound } from "@/components/blog/BlogNotFound";

// See src/app/blog/[slug]/not-found.tsx for why this segment needs its own
// title (META-1) instead of falling through to the bare site-name default.
export const metadata: Metadata = {
  title: "Tag not found",
};

export default function NotFound() {
  return (
    <section className="py-12 lg:py-16">
      <Container size="full" className="max-w-[1280px]">
        <BlogNotFound
          title="Tag not found"
          description="This tag may have been renamed or no longer exists."
        />
      </Container>
    </section>
  );
}
