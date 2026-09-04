"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import "highlight.js/styles/github-dark-dimmed.css";

export interface ArticleContentProps {
  html: string;
  className?: string;
}

/**
 * Styles WP rich-text HTML (rendered via dangerouslySetInnerHTML). Every
 * `html` value is sanitized upstream, server-side in the adapters, against
 * the allowlist in src/lib/content/sanitize-wp-html.ts (ARCH-5) — never
 * pass this component HTML that hasn't been through sanitizeWpHtml.
 * No typography plugin is installed, so nested-element selectors carry the
 * design tokens instead of a `prose` class.
 */
export function ArticleContent({ html, className }: ArticleContentProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const codeBlocks = container.querySelectorAll("pre code");
    if (codeBlocks.length === 0) return;

    let cancelled = false;
    import("@/lib/content/syntax-highlight").then(({ highlightElement }) => {
      if (cancelled) return;
      codeBlocks.forEach((block) => highlightElement(block as HTMLElement));
    });

    return () => {
      cancelled = true;
    };
  }, [html]);

  return (
    <div
      ref={contentRef}
      className={cn(
        "font-body text-sm leading-relaxed text-muted [&>*+*]:mt-5",
        "[&_h2]:mt-10 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-white",
        "[&_h3]:mt-8 [&_h3]:font-heading [&_h3]:text-xl [&_h3]:font-bold [&_h3]:text-white",
        "[&_p]:text-sm [&_p]:text-muted",
        "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2",
        "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5",
        "[&_li]:text-sm [&_li]:text-muted",
        "[&_strong]:font-semibold [&_strong]:text-white",
        "[&_blockquote]:border-l-2 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:text-white/80 [&_blockquote]:italic",
        "[&_img]:rounded-2xl [&_img]:border [&_img]:border-border-strong",
        "[&_code]:rounded [&_code]:bg-white/5 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-xs",
        // Fenced code blocks: distinct container from inline `code`, with its
        // own scroll so long lines don't blow out the article column.
        "[&_pre]:overflow-x-auto [&_pre]:rounded-2xl [&_pre]:border [&_pre]:border-border-strong [&_pre]:bg-black/40 [&_pre]:p-4",
        "[&_pre_code]:rounded-none [&_pre_code]:bg-transparent [&_pre_code]:p-0",
        // WP tables/embeds render at fixed pixel widths by default; force
        // them to respect the column instead of overflowing on mobile.
        "[&_table]:block [&_table]:w-full [&_table]:overflow-x-auto [&_table]:border-collapse",
        "[&_th]:border [&_th]:border-border-strong [&_th]:bg-white/5 [&_th]:p-3 [&_th]:text-left [&_th]:font-heading [&_th]:text-xs [&_th]:font-bold [&_th]:uppercase [&_th]:text-white",
        "[&_td]:border [&_td]:border-border-strong [&_td]:p-3 [&_td]:text-sm [&_td]:text-muted",
        "[&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:rounded-2xl [&_iframe]:border [&_iframe]:border-border-strong",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
