import { Container } from "@/components/ui/Container";
import { BlogNotFound } from "@/components/blog/BlogNotFound";

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
