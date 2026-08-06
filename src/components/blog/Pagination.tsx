"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PageInfo } from "@/types/domain/pagination";
import { cn } from "@/lib/utils";

export interface PaginationProps {
  pageInfo: PageInfo;
  basePath: string;
  searchParams?: Record<string, string>;
  className?: string;
}

function buildNextHref(
  basePath: string,
  searchParams: Record<string, string> | undefined,
  after: string,
): string {
  const params = new URLSearchParams(searchParams);
  params.set("after", after);
  return `${basePath}?${params.toString()}`;
}

/**
 * Relay-style cursor pagination: "Next" follows pageInfo.endCursor (real,
 * works against WPGraphQL's relay connections once live). "Previous" uses
 * browser history rather than a `before`/`last` GraphQL round-trip, since
 * the repository layer only implements forward (`first`/`after`) pagination
 * — going back one step in history is equivalent for sequential Next clicks
 * without adding backward-cursor support nothing else in this codebase uses.
 */
export function Pagination({ pageInfo, basePath, searchParams, className }: PaginationProps) {
  const router = useRouter();

  if (!pageInfo.hasNextPage && !pageInfo.hasPreviousPage) {
    return null;
  }

  return (
    <nav
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-3", className)}
    >
      <button
        type="button"
        onClick={() => router.back()}
        disabled={!pageInfo.hasPreviousPage}
        className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-glass px-4 py-2 font-body text-sm text-white outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        Previous
      </button>

      {pageInfo.hasNextPage && pageInfo.endCursor ? (
        <Link
          href={buildNextHref(basePath, searchParams, pageInfo.endCursor)}
          className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-glass px-4 py-2 font-body text-sm text-white outline-none transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      ) : (
        <span
          aria-disabled="true"
          className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-glass px-4 py-2 font-body text-sm text-white opacity-40"
        >
          Next
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </span>
      )}
    </nav>
  );
}
