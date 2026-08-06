import { cn } from "@/lib/utils";

export interface PostCardSkeletonProps {
  className?: string;
}

export function PostCardSkeleton({ className }: PostCardSkeletonProps) {
  return (
    <div
      className={cn(
        "flex h-full animate-pulse flex-col overflow-hidden rounded-[25px] border border-border-strong bg-glass",
        className,
      )}
    >
      <div className="aspect-[16/9] w-full bg-white/5" />
      <div className="flex flex-1 flex-col gap-3 p-6">
        <div className="h-6 w-20 rounded-full bg-white/5" />
        <div className="h-5 w-4/5 rounded bg-white/5" />
        <div className="h-4 w-full rounded bg-white/5" />
        <div className="h-4 w-2/3 rounded bg-white/5" />
        <div className="mt-auto h-3 w-1/2 rounded bg-white/5" />
      </div>
    </div>
  );
}

export function PostCardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Loading posts"
    >
      {Array.from({ length: count }, (_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </div>
  );
}
