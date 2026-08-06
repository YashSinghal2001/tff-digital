import { cn } from "@/lib/utils";

export interface ArticleContentProps {
  html: string;
  className?: string;
}

/**
 * Styles raw WP post HTML (rendered via dangerouslySetInnerHTML — content
 * comes from the CMS, not user input, same trust boundary as JsonLd).
 * No typography plugin is installed, so nested-element selectors carry the
 * design tokens instead of a `prose` class.
 */
export function ArticleContent({ html, className }: ArticleContentProps) {
  return (
    <div
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
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
