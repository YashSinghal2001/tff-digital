import { Container } from "@/components/ui/Container";
import { PostCardSkeletonGrid } from "@/components/blog/PostCardSkeleton";

export default function Loading() {
  return (
    <section className="py-16 lg:py-24">
      <Container size="full" className="max-w-[1280px]">
        <PostCardSkeletonGrid />
      </Container>
    </section>
  );
}
