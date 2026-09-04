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
 * video/audio, table caption/tfoot). `id` stays on headings because WP emits
 * them and the ToC/share anchors depend on them; `class` stays everywhere
 * because styling is tag-based (inert) and highlight.js reads `language-*`
 * from <code>. Everything not listed is dropped: event handlers, `style`,
 * `srcdoc`, and scriptable/embedding elements (script, style, svg, math,
 * object, embed, form controls, meta/base/link). Disallowed tags lose only
 * their tags — text content survives — except <script>/<style>, which are
 * dropped with their contents.
 */
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
    a: ["href", "title", "target", "rel"],
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
  // Void elements in this allowlist (sanitize-html's default list also
  // carries tags this policy never allows, e.g. <base>/<link>/<meta>).
  selfClosing: ["img", "br", "hr", "source"],
};

/** Sanitizes a WordPress rich-text HTML fragment against WP_HTML_POLICY. */
export function sanitizeWpHtml(html: string): string {
  if (!html) return html;
  return sanitizeHtml(html, WP_HTML_POLICY);
}
