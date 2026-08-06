import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({ icon: Icon = Inbox, title, description, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 py-24 text-center", className)}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full border border-border-strong bg-glass text-primary">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <p className="font-heading text-base font-bold text-white">{title}</p>
      {description ? <p className="max-w-sm font-body text-sm text-muted">{description}</p> : null}
    </div>
  );
}
