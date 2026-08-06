import Link from "next/link";
import { FileQuestion } from "lucide-react";
import { EmptyState } from "@/components/common/EmptyState";
import { buttonVariants } from "@/components/ui/button-variants";
import { ROUTES } from "@/constants/routes";

export interface BlogNotFoundProps {
  title?: string;
  description?: string;
}

export function BlogNotFound({
  title = "Article not found",
  description = "This post may have been moved or no longer exists.",
}: BlogNotFoundProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-12">
      <EmptyState icon={FileQuestion} title={title} description={description} />
      <Link href={ROUTES.blog} className={buttonVariants({ variant: "primary", size: "md" })}>
        Back to blog
      </Link>
    </div>
  );
}
