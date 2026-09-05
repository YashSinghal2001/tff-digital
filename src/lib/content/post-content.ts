const WORDS_PER_MINUTE = 200;

// WordPress's common named entities (CONTENT-1). Deliberately not a full
// HTML5 table: rendered WP content uses this handful plus numeric forms, and
// an unknown name passes through unchanged rather than guessing.
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  ndash: "–",
  mdash: "—",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  copy: "©",
  reg: "®",
  trade: "™",
};

// Single scan over named, decimal, and hex forms — one pass means a decoded
// "&" can never combine with following text and be decoded again within the
// same call. Never throws: out-of-range/surrogate/NUL code points and unknown
// names are left verbatim (a throwing decoder would turn a degraded CMS
// payload into a 5xx on soft-fetch routes). The `i` flag deliberately folds
// case on names (&AMP; works; the exotic case-distinct pair &Lt;/&Gt; = ≪/≫
// collapses to </> — accepted, they don't occur in WP marketing copy).
function decodeHtmlEntities(text: string): string {
  return text.replace(
    /&(?:#x([0-9a-f]+)|#(\d+)|([a-z]+));/gi,
    (
      match,
      hex: string | undefined,
      dec: string | undefined,
      name: string | undefined,
    ) => {
      if (hex || dec) {
        const code = hex ? parseInt(hex, 16) : Number(dec);
        if (
          code === 0 ||
          code > 0x10ffff ||
          (code >= 0xd800 && code <= 0xdfff)
        ) {
          return match;
        }
        return String.fromCodePoint(code);
      }
      return NAMED_ENTITIES[(name as string).toLowerCase()] ?? match;
    },
  );
}

/**
 * Tags stripped, then entities decoded — in that order: decoding first would
 * turn author-escaped markup (`&lt;b&gt;`) into real tags the stripper then
 * eats. The output is plain TEXT that may legitimately contain <, > and &,
 * so it must only ever reach escaping sinks (React text nodes, metadata
 * attributes, JsonLd's <-escaped script) — never dangerouslySetInnerHTML.
 * Known limit: applying stripHtml twice to the same value decodes
 * double-encoded sequences twice ("&amp;hellip;" → "…"); acceptable per the
 * audit ("purely additive text-quality fix", CONTENT-1).
 */
export function stripHtml(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]*>/g, " "));
}

/** Plain-text version of a WP HTML fragment: tags stripped, whitespace collapsed. */
export function htmlToPlainText(html: string): string {
  return stripHtml(html).replace(/\s+/g, " ").trim();
}

export function getReadingTimeMinutes(html: string): number {
  const text = stripHtml(html).trim();
  if (!text) return 0;
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

// WordPress content images use a specific registered size (e.g.
// "photo-1024x576.jpg") while the featured image field points at the
// original ("photo.jpg") — and WP renames very large originals to
// "photo-scaled.jpg". Strip both suffixes so all variants of the same
// underlying media item compare equal.
function getImageFilenameStem(url: string): string {
  const path = url.split(/[?#]/)[0];
  const filename = path.split("/").pop() ?? path;
  return filename
    .replace(/-\d+x\d+(?=\.\w+$)/, "")
    .replace(/-scaled(?=\.\w+$)/, "")
    .toLowerCase();
}

// The image may sit bare, inside a <figure> (with optional link/caption), or
// inside a <p>, optionally wrapped in an <a> (editors often link the image to
// its full-size file). Leading whitespace and HTML comments are skipped.
const LEADING_IMAGE_BLOCK =
  /^(?:\s|<!--[\s\S]*?-->)*(?:<figure[^>]*>[\s\S]*?<img[^>]*>[\s\S]*?<\/figure>|<p[^>]*>\s*(?:<a[^>]*>\s*)?<img[^>]*\/?>\s*(?:<\/a>\s*)?<\/p>|(?:<a[^>]*>\s*)?<img[^>]*\/?>(?:\s*<\/a>)?)/i;

/**
 * WordPress editors often drag the featured image into the top of the post
 * body too, so it renders once as the page's hero image and again as the
 * post's first content block. If the very first element in the content is
 * an <img>/<figure> whose source is that same media item, drop just that
 * one block — later reuses of the same image, or a different leading image,
 * are left alone.
 */
export function stripDuplicateFeaturedImage(
  html: string,
  featuredImageUrl: string | null | undefined,
): string {
  if (!featuredImageUrl) return html;

  const match = html.match(LEADING_IMAGE_BLOCK);
  if (!match) return html;

  const block = match[0];
  const srcMatch = block.match(/<img[^>]*\ssrc=["']([^"']+)["']/i);
  if (!srcMatch) return html;

  if (
    getImageFilenameStem(srcMatch[1]) !== getImageFilenameStem(featuredImageUrl)
  ) {
    return html;
  }

  return html.slice(block.length);
}

export interface HeadingEntry {
  id: string;
  text: string;
  level: 2 | 3;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Injects id="..." into every h2/h3 in the post content so ToC anchor links
 * and share-to-section links resolve, then returns both the augmented HTML
 * and the flat list of headings used to render the ToC itself.
 *
 * `text` is plain text for a React text node (CONTENT-1): the input is
 * sanitized HTML, whose text is entity-escaped (`Q&amp;A`), so it is decoded
 * after the inline tags are removed — same order and decoder as stripHtml.
 * The `id` is still slugified from the UNdecoded text so existing anchors
 * and share links stay byte-stable (`seo-amp-sem`), and the HTML itself is
 * returned untouched apart from the injected ids.
 */
export function withHeadingIds(html: string): {
  html: string;
  headings: HeadingEntry[];
} {
  const headings: HeadingEntry[] = [];
  const seen = new Map<string, number>();

  const augmented = html.replace(
    /<h([23])([^>]*)>(.*?)<\/h\1>/gi,
    (match, levelStr: string, attrs: string, inner: string) => {
      const level = Number(levelStr) as 2 | 3;
      const rawText = inner.replace(/<[^>]*>/g, "").trim();
      if (!rawText) return match;

      const base = slugifyHeading(rawText) || `section-${headings.length + 1}`;
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count}`;

      headings.push({ id, text: decodeHtmlEntities(rawText), level });

      const hasId = /\sid=/.test(attrs);
      const newAttrs = hasId ? attrs : `${attrs} id="${id}"`;
      return `<h${level}${newAttrs}>${inner}</h${level}>`;
    },
  );

  return { html: augmented, headings };
}
