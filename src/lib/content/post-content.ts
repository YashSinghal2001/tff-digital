const WORDS_PER_MINUTE = 200;

export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, " ");
}

export function getReadingTimeMinutes(html: string): number {
  const text = stripHtml(html).trim();
  if (!text) return 0;
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}

// WordPress content images use a specific registered size (e.g.
// "photo-1024x576.jpg") while the featured image field points at the
// original ("photo.jpg") — strip that size suffix so the two can be
// compared as the same underlying media item.
function getImageFilenameStem(url: string): string {
  const path = url.split(/[?#]/)[0];
  const filename = path.split("/").pop() ?? path;
  return filename.replace(/-\d+x\d+(?=\.\w+$)/, "").toLowerCase();
}

const LEADING_IMAGE_BLOCK =
  /^\s*(?:<figure[^>]*>[\s\S]*?<img[^>]*>[\s\S]*?<\/figure>|<p[^>]*>\s*<img[^>]*\/?>\s*<\/p>|<img[^>]*\/?>)/i;

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

  if (getImageFilenameStem(srcMatch[1]) !== getImageFilenameStem(featuredImageUrl)) {
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
 */
export function withHeadingIds(html: string): { html: string; headings: HeadingEntry[] } {
  const headings: HeadingEntry[] = [];
  const seen = new Map<string, number>();

  const augmented = html.replace(
    /<h([23])([^>]*)>(.*?)<\/h\1>/gi,
    (match, levelStr: string, attrs: string, inner: string) => {
      const level = Number(levelStr) as 2 | 3;
      const text = inner.replace(/<[^>]*>/g, "").trim();
      if (!text) return match;

      const base = slugifyHeading(text) || `section-${headings.length + 1}`;
      const count = seen.get(base) ?? 0;
      seen.set(base, count + 1);
      const id = count === 0 ? base : `${base}-${count}`;

      headings.push({ id, text, level });

      const hasId = /\sid=/.test(attrs);
      const newAttrs = hasId ? attrs : `${attrs} id="${id}"`;
      return `<h${level}${newAttrs}>${inner}</h${level}>`;
    },
  );

  return { html: augmented, headings };
}
