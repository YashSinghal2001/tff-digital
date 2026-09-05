import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/Badge";
import { ROUTES } from "@/constants/routes";
import type { CaseStudy } from "@/types/domain/case-study";
import { cn } from "@/lib/utils";

export interface CaseStudyCardProps {
  caseStudy: CaseStudy;
  className?: string;
  priority?: boolean;
}

export function CaseStudyCard({
  caseStudy,
  className,
  priority = false,
}: CaseStudyCardProps) {
  const headlineResult = caseStudy.results[0];

  return (
    <Link
      href={ROUTES.caseStudy(caseStudy.slug)}
      // The whole card is one link, so its computed name would concatenate
      // badge, title, summary, client, and result stat (CARDA11Y-1).
      aria-label={caseStudy.title}
      className={cn(
        "group border-border-strong bg-glass hover:border-primary/50 focus-visible:ring-primary/50 flex h-full flex-col overflow-hidden rounded-[25px] border transition-colors focus-visible:ring-2 focus-visible:outline-none",
        className,
      )}
    >
      <div className="relative aspect-[16/9] w-full shrink-0 overflow-hidden bg-white/5">
        {caseStudy.featuredImage ? (
          <Image
            src={caseStudy.featuredImage.url}
            alt={caseStudy.featuredImage.altText || caseStudy.title}
            fill
            priority={priority}
            sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 400px"
            className="object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6">
        {caseStudy.industry ? (
          <Badge tone="info" className="w-fit">
            {caseStudy.industry}
          </Badge>
        ) : null}

        <h3 className="font-heading line-clamp-2 text-lg font-bold text-white">
          {caseStudy.title}
        </h3>
        {caseStudy.summary ? (
          <p className="font-body text-muted line-clamp-2 text-sm">
            {caseStudy.summary}
          </p>
        ) : null}

        {headlineResult ? (
          <div className="font-body text-muted mt-auto flex items-center gap-2 pt-2 text-xs">
            {caseStudy.clientName ? <span>{caseStudy.clientName}</span> : null}
            {caseStudy.clientName ? <span aria-hidden="true">·</span> : null}
            <span className="text-primary font-semibold">
              {headlineResult.value} {headlineResult.label}
            </span>
          </div>
        ) : caseStudy.clientName ? (
          <p className="font-body text-muted mt-auto pt-2 text-xs">
            {caseStudy.clientName}
          </p>
        ) : null}
      </div>
    </Link>
  );
}
