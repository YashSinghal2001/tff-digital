import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({
  label = "Loading…",
  className,
}: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-24 text-center",
        className,
      )}
    >
      {/* The spinner conveys "still working", so reduced motion slows it
          rather than freezing it — a stopped spinner reads as a hung page. */}
      <LoaderCircle
        className="text-primary h-8 w-8 animate-spin motion-reduce:[animation-duration:2.4s]"
        aria-hidden="true"
      />
      <p className="font-body text-muted text-sm">{label}</p>
    </div>
  );
}
