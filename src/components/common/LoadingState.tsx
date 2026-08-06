import { LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  label?: string;
  className?: string;
}

export function LoadingState({ label = "Loading…", className }: LoadingStateProps) {
  return (
    <div
      role="status"
      className={cn("flex flex-col items-center justify-center gap-3 py-24 text-center", className)}
    >
      <LoaderCircle className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      <p className="font-body text-sm text-muted">{label}</p>
    </div>
  );
}
