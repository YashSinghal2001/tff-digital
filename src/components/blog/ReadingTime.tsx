import { Clock } from "lucide-react";
import { getReadingTimeMinutes } from "@/lib/content/post-content";
import { cn } from "@/lib/utils";

export interface ReadingTimeProps {
  content: string;
  className?: string;
}

export function ReadingTime({ content, className }: ReadingTimeProps) {
  const minutes = getReadingTimeMinutes(content);

  return (
    <span className={cn("inline-flex items-center gap-1.5 font-body text-xs text-muted", className)}>
      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
      {minutes} min read
    </span>
  );
}
