import { Container } from "@/components/ui/Container";
import { BlogNotFound } from "@/components/blog/BlogNotFound";

export default function NotFound() {
  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <BlogNotFound />
      </Container>
    </section>
  );
}
