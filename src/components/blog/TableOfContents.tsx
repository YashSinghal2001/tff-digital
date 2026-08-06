"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";
import type { HeadingEntry } from "@/lib/content/post-content";
import { cn } from "@/lib/utils";

export interface TableOfContentsProps {
  headings: HeadingEntry[];
  className?: string;
}

export function TableOfContents({ headings, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.find((entry) => entry.isIntersecting);
        if (visible) setActiveId(visible.target.id);
      },
      { rootMargin: "-96px 0px -70% 0px" },
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav
      aria-label="Table of contents"
      className={cn("rounded-[25px] border border-border-strong bg-glass p-6", className)}
    >
      <p className="mb-3 flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-wide text-white">
        <List className="h-4 w-4 text-primary" aria-hidden="true" />
        On this page
      </p>
      <ul className="flex flex-col gap-2">
        {headings.map((heading) => (
          <li key={heading.id} className={heading.level === 3 ? "pl-3" : undefined}>
            <a
              href={`#${heading.id}`}
              className={cn(
                "font-body text-sm text-muted transition-colors hover:text-white",
                activeId === heading.id && "font-semibold text-primary",
              )}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
