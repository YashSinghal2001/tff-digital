import sanitizeHtml from "sanitize-html";

/**
 * WordPress rich-text sanitizer (ARCH-5). Called from the adapter layer —
 * server-side, before any render — on every WP HTML field that reaches
 * ArticleContent's dangerouslySetInnerHTML. WordPress content is authored by
 * trusted staff, but wp-admin is the one externally-reachable authoring
 * surface (SEC-2/CMS-3 track its open attack vectors), so this allowlist is
 * the code-level backstop that keeps a CMS compromise from becoming stored
 * XSS on every blog post, case study, and service page.
 *
 * The allowlist is the union of what live WP content emits, what
 * ArticleContent's tag-selector styling anticipates (including <iframe>
 * embeds, the audit's one named must-preserve, https src only), and the
 * remaining inert Gutenberg core blocks/formats (h5/h6, details, kbd/mark,
 * video/audio, table caption/tfoot, footnotes). Iframe hosts mirror
 * next.config.ts's `frame-src` so the two allowlists can't drift apart.
 *
 * `id` survives on headings (WP "HTML anchor", ToC/share links) and on
 * footnote <li>/<a>, but only when it matches SAFE_ID — the lowercase,
 * hyphen-separated shape withHeadingIds itself produces. Any element id
 * becomes a named property on `window`, so an unrestricted id could clobber
 * a script global (`__next_f`, `webpackChunk_N_E`) and break hydration;
 * none of those can be spelled without underscores or uppercase.
 * `class` stays everywhere: styling is tag-based and highlight.js reads
 * `language-*` from <code>. A class can't execute script, though it can
 * reach Tailwind utilities already in the bundle — defacement within the
 * trusted-author model, not a trust-boundary crossing. Everything not
 * listed is dropped: event handlers, `style`, `srcdoc`, and scriptable or
 * embedding elements (script, style, svg, math, object, embed, form
 * controls, meta/base/link). Disallowed tags lose only their tags — text
 * content survives — except <script>/<style>, which are dropped with their
 * contents.
 */
const SAFE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// rel tokens WordPress emits (new-tab links, nofollow/sponsored settings).
const ALLOWED_REL = new Set([
  "noopener",
  "noreferrer",
  "nofollow",
  "sponsored",
  "ugc",
]);

const dropUnsafeId: sanitizeHtml.Transformer = (tagName, attribs) => {
  if (attribs.id !== undefined && !SAFE_ID.test(attribs.id)) {
    delete attribs.id;
  }
  return { tagName, attribs };
};

// A target="_blank" link must not re-enable window.opener via rel="opener".
const normalizeLink: sanitizeHtml.Transformer = (tagName, attribs) => {
  const rel = new Set(
    (attribs.rel ?? "").split(/\s+/).filter((token) => ALLOWED_REL.has(token)),
  );
  if (attribs.target !== undefined) rel.add("noopener");
  if (rel.size > 0) attribs.rel = [...rel].join(" ");
  else delete attribs.rel;
  return dropUnsafeId(tagName, attribs);
};
const WP_HTML_POLICY: sanitizeHtml.IOptions = {
  allowedTags: [
    "p",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "dl",
    "dt",
    "dd",
    "a",
    "img",
    "figure",
    "figcaption",
    "div",
    "span",
    "strong",
    "em",
    "b",
    "i",
    "s",
    "u",
    "del",
    "ins",
    "mark",
    "kbd",
    "abbr",
    "cite",
    "q",
    "small",
    "sup",
    "sub",
    "code",
    "pre",
    "blockquote",
    "details",
    "summary",
    "table",
    "caption",
    "thead",
    "tbody",
    "tfoot",
    "tr",
    "th",
    "td",
    "iframe",
    "video",
    "audio",
    "source",
    "br",
    "hr",
  ],
  allowedAttributes: {
    "*": ["class"],
    h2: ["id"],
    h3: ["id"],
    h4: ["id"],
    h5: ["id"],
    h6: ["id"],
    a: ["id", "href", "title", "target", "rel"],
    li: ["id"],
    ol: ["start", "reversed", "type"],
    abbr: ["title"],
    details: ["open"],
    img: [
      "src",
      "srcset",
      "sizes",
      "alt",
      "title",
      "width",
      "height",
      "loading",
      "decoding",
    ],
    th: ["colspan", "rowspan", "scope"],
    td: ["colspan", "rowspan"],
    iframe: [
      "src",
      "title",
      "width",
      "height",
      "allow",
      "allowfullscreen",
      "frameborder",
      "loading",
      "referrerpolicy",
    ],
    video: [
      "src",
      "poster",
      "controls",
      "preload",
      "width",
      "height",
      "loop",
      "muted",
      "playsinline",
    ],
    audio: ["src", "controls", "preload", "loop"],
    source: ["src", "type"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Note: srcset candidates are checked against the GLOBAL allowedSchemes
  // (an upstream sanitize-html quirk — allowedSchemesByTag never applies to
  // srcset entries), so javascript:/data: are still blocked there but the
  // img https-only tightening below covers src, not srcset.
  allowedSchemesByTag: {
    img: ["http", "https"],
    iframe: ["https"],
    video: ["https"],
    audio: ["https"],
    source: ["https"],
  },
  // sanitize-html's default list is href/src/cite; `poster` is the one extra
  // URL-bearing attribute this policy allows.
  allowedSchemesAppliedToAttributes: ["href", "src", "cite", "poster"],
  allowProtocolRelative: false,
  // Keep in sync with `frame-src` in next.config.ts (CSP blocks the rest
  // anyway; this makes the sanitizer's own guarantee explicit).
  allowedIframeHostnames: [
    "www.youtube.com",
    "youtube.com",
    "www.youtube-nocookie.com",
    "www.google.com",
  ],
  transformTags: {
    h2: dropUnsafeId,
    h3: dropUnsafeId,
    h4: dropUnsafeId,
    h5: dropUnsafeId,
    h6: dropUnsafeId,
    li: dropUnsafeId,
    a: normalizeLink,
  },
  // Void elements in this allowlist (sanitize-html's default list also
  // carries tags this policy never allows, e.g. <base>/<link>/<meta>).
  selfClosing: ["img", "br", "hr", "source"],
};

/** Sanitizes a WordPress rich-text HTML fragment against WP_HTML_POLICY. */
export function sanitizeWpHtml(html: string): string {
  if (!html) return html;
  return sanitizeHtml(html, WP_HTML_POLICY);
}
