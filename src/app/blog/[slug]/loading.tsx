import { Container } from "@/components/ui/Container";

export default function Loading() {
  return (
    <div className="py-10 lg:py-16" role="status" aria-label="Loading article">
      <Container size="full" className="max-w-[1280px]">
        <div className="mx-auto flex max-w-3xl animate-pulse flex-col gap-4">
          <div className="h-6 w-24 rounded-full bg-white/5" />
          <div className="h-10 w-full rounded bg-white/5" />
          <div className="h-10 w-2/3 rounded bg-white/5" />
          <div className="h-4 w-1/2 rounded bg-white/5" />
        </div>
        <div className="mx-auto mt-10 flex max-w-3xl animate-pulse flex-col gap-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="h-4 w-full rounded bg-white/5" />
          ))}
        </div>
      </Container>
    </div>
  );
}
