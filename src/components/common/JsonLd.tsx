export interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

/**
 * Renders one or more schema.org objects as a JSON-LD <script> tag.
 * No visual output — safe to drop into any page/layout.
 *
 * Escapes "<" so a WordPress-authored field containing the literal text
 * "</script>" can't prematurely terminate this script tag — standard
 * hardening for JSON embedded in HTML, doesn't change the JSON-LD data
 * itself (browsers/crawlers decode < back to "<" when parsing JSON).
 */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }}
    />
  );
}
