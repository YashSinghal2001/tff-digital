import Link from "next/link";
import type { RichTextPart } from "@/data/home-preview-content";

/** Inline text with internal links, styled like the site's other inline links. */
export function RichText({ parts }: { parts: readonly RichTextPart[] }) {
  return parts.map((part, index) =>
    typeof part === "string" ? (
      part
    ) : (
      <Link
        key={index}
        href={part.href}
        className="text-primary transition-colors hover:text-white"
      >
        {part.text}
      </Link>
    ),
  );
}
