import { Newspaper } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";

export interface BlogEmptyStateProps {
  title?: string;
  description?: string;
}

export function BlogEmptyState({
  title = "No articles yet",
  description = "Check back soon — we're publishing new content regularly.",
}: BlogEmptyStateProps) {
  return <EmptyState icon={Newspaper} title={title} description={description} />;
}
