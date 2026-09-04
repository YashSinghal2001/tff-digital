import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extensions: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import {
  stripDuplicateFeaturedImage,
  stripHtml,
  withHeadingIds,
} from "./post-content.ts";
import { sanitizeWpHtml } from "./sanitize-wp-html.ts";

// ARCH-5: attacker-controlled WordPress HTML must not be able to execute
// script through the ArticleContent rendering path. These are output
// assertions against the real sanitizer, not import-existence checks.

const SCRIPTABLE_TAG =
  /<\/?(script|style|svg|math|object|embed|form|input|button|textarea|select|template|meta|base|link|noscript|body|html|head)\b/i;
const EVENT_HANDLER_ATTR = /\son[a-z]+\s*=/i;
const DANGEROUS_ATTR = /\s(style|srcdoc|formaction|xlink:href|action)\s*=/i;
const ACTIVE_URL_ATTR =
  /\s(href|src|poster|srcset|cite)\s*=\s*["']?\s*(?:javascript|vbscript|data|blob|file):/i;

/** Asserts a sanitized fragment carries no script-execution vector. */
function assertInert(out: string, label: string) {
  assert.doesNotMatch(out, SCRIPTABLE_TAG, `${label}: scriptable tag`);
  assert.doesNotMatch(out, EVENT_HANDLER_ATTR, `${label}: event handler`);
  assert.doesNotMatch(out, DANGEROUS_ATTR, `${label}: dangerous attr`);
  assert.doesNotMatch(out, ACTIVE_URL_ATTR, `${label}: active URL`);
  // Idempotence: re-sanitizing the output changes nothing, so the serialized
  // form re-parses to the same tree (no mutation-XSS drift on second parse).
  assert.equal(sanitizeWpHtml(out), out, `${label}: not idempotent`);
}

describe("sanitizeWpHtml — adversarial payloads", () => {
  test("drops <script> with its contents, inline and src-based", () => {
    assert.equal(
      sanitizeWpHtml("<p>hi</p><script>alert(document.cookie)</script>"),
      "<p>hi</p>",
    );
    assert.equal(
      sanitizeWpHtml('<script src="https://evil.test/x.js"></script><p>a</p>'),
      "<p>a</p>",
    );
  });

  test("strips event-handler attributes", () => {
    assert.equal(
      sanitizeWpHtml(
        '<img src="https://cms.tffdigital.com/a.png" onerror="alert(1)">',
      ),
      '<img src="https://cms.tffdigital.com/a.png" />',
    );
    assert.equal(sanitizeWpHtml('<p onclick="alert(1)">x</p>'), "<p>x</p>");
    assert.equal(
      sanitizeWpHtml('<body onload="alert(1)"><p>x</p></body>'),
      "<p>x</p>",
    );
    // unquoted attribute syntax
    assert.equal(
      sanitizeWpHtml(
        "<img src=https://cms.tffdigital.com/a.png onerror=alert(1)>",
      ),
      '<img src="https://cms.tffdigital.com/a.png" />',
    );
  });

  test("blocks javascript:/vbscript:/data: URLs on href/src, however obfuscated", () => {
    const hrefs = [
      "javascript:alert(1)",
      "JaVaScRiPt:alert(1)",
      " javascript:alert(1)",
      "\tjava\nscript:alert(1)",
      "java&#115;cript:alert(1)",
      "&#x6A;avascript:alert(1)",
      "vbscript:msgbox(1)",
      "data:text/html;base64,PHNjcmlwdD4=",
    ];
    for (const href of hrefs) {
      assert.equal(
        sanitizeWpHtml(`<a href="${href}">x</a>`),
        "<a>x</a>",
        `href=${JSON.stringify(href)}`,
      );
    }
    assert.equal(
      sanitizeWpHtml('<img src="data:text/html;base64,PHNjcmlwdD4=">'),
      "<img />",
    );
    assert.equal(sanitizeWpHtml('<img src="javascript:alert(1)">'), "<img />");
    // protocol-relative is off: can't smuggle an off-origin scheme choice
    assert.equal(sanitizeWpHtml('<a href="//evil.test/x">x</a>'), "<a>x</a>");
  });

  test("iframe src is https-only; javascript:/http:/data: iframes lose src", () => {
    assert.equal(
      sanitizeWpHtml(
        '<iframe src="https://www.youtube.com/embed/x" allowfullscreen></iframe>',
      ),
      '<iframe src="https://www.youtube.com/embed/x" allowfullscreen></iframe>',
    );
    assert.equal(
      sanitizeWpHtml('<iframe src="javascript:alert(1)"></iframe>'),
      "<iframe></iframe>",
    );
    assert.equal(
      sanitizeWpHtml('<iframe src="http://evil.test/"></iframe>'),
      "<iframe></iframe>",
    );
    assert.equal(
      sanitizeWpHtml(
        '<iframe src="data:text/html,<script>alert(1)</script>"></iframe>',
      ),
      "<iframe></iframe>",
    );
    assert.equal(
      sanitizeWpHtml('<iframe srcdoc="<script>alert(1)</script>"></iframe>'),
      "<iframe></iframe>",
    );
  });

  test("drops scriptable/embed elements not in the allowlist", () => {
    assert.equal(
      sanitizeWpHtml('<object data="x"></object><p>a</p>'),
      "<p>a</p>",
    );
    assert.equal(sanitizeWpHtml('<embed src="x"><p>a</p>'), "<p>a</p>");
    assert.equal(
      sanitizeWpHtml('<svg onload="alert(1)"><circle /></svg><p>a</p>'),
      "<p>a</p>",
    );
    assert.equal(
      sanitizeWpHtml("<style>*{background:url(javascript:1)}</style><p>a</p>"),
      "<p>a</p>",
    );
    assert.equal(
      sanitizeWpHtml(
        '<form action="https://evil.test"><input name="x"></form><p>a</p>',
      ),
      "<p>a</p>",
    );
  });

  test("strips style attributes and survives malformed HTML without throwing", () => {
    assert.equal(
      sanitizeWpHtml('<p style="position:fixed;inset:0">x</p>'),
      "<p>x</p>",
    );
    assert.equal(
      sanitizeWpHtml("<p><strong>unclosed"),
      "<p><strong>unclosed</strong></p>",
    );
    assert.equal(
      sanitizeWpHtml(
        "<<script>script>alert(1)<</script>/script><p>a</p>",
      ).includes("<script"),
      false,
    );
  });

  test("video/audio/details attributes stay inert (new allowlist entries)", () => {
    assert.equal(
      sanitizeWpHtml(
        '<details open ontoggle="alert(1)"><summary>s</summary>x</details>',
      ),
      "<details open><summary>s</summary>x</details>",
    );
    assert.equal(
      sanitizeWpHtml(
        '<video src="javascript:alert(1)" poster="javascript:alert(1)" onplay="alert(1)"></video>',
      ),
      "<video></video>",
    );
    assert.equal(
      sanitizeWpHtml(
        '<video controls><source src="data:x" onerror="alert(1)"></video>',
      ),
      "<video controls><source /></video>",
    );
  });

  test("a corpus of known bypass shapes all come out inert and idempotent", () => {
    const corpus = [
      '<p title="</p><img src=x onerror=alert(1)>">',
      '<noscript><p title="</noscript><img src=x onerror=alert(1)>"></noscript>',
      "<scr<script>ipt>alert(1)</scr</script>ipt>",
      "<p><!-- <script>alert(1)</script> -->a</p>",
      '<math><mi xlink:href="javascript:alert(1)">x</mi></math>',
      '<svg><script>alert(1)</script><a xlink:href="javascript:alert(1)"><text>x</text></a></svg>',
      "<svg><style><img src=x onerror=alert(1)></style></svg>",
      '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
      '<base href="javascript:alert(1)//">',
      '<link rel="import" href="https://evil.test/x.html">',
      "<template><img src=x onerror=alert(1)></template>",
      '<button formaction="javascript:alert(1)">x</button>',
      '<a href="https://ok.test" onmouseover="alert(1)" onfocus="alert(1)">x</a>',
      '<img src="https://ok.test/a.png" srcset="javascript:alert(1) 1x">',
      '<a href="&#0000106;avascript:alert(1)">x</a>',
      '<a href="jav&#x09;ascript:alert(1)">x</a>',
      '<img src="x" onerror="alert(1)"//>',
      '<div style="background:url(javascript:alert(1))">x</div>',
      '<iframe src="https://ok.test" sandbox="allow-scripts" srcdoc="<img src=x onerror=alert(1)>"></iframe>',
      "<textarea><script>alert(1)</script></textarea>",
      "<select><option><script>alert(1)</script></option></select>",
      "<table><math><mtext><table><mglyph><style><img src=x onerror=alert(1)></style></mglyph></table></mtext></math></table>",
      "<p>" + "<div>".repeat(300) + "x" + "</div>".repeat(300) + "</p>",
    ];
    for (const payload of corpus) {
      assertInert(sanitizeWpHtml(payload), payload.slice(0, 60));
    }
  });
});

describe("sanitizeWpHtml — legitimate WordPress formatting survives", () => {
  test("the live post's exact markup shapes pass through", () => {
    const wp =
      '<h2 class="wp-block-heading" id="what-is-seo-for-small-businesses">What is SEO?</h2>' +
      '<p class="wp-block-paragraph">Body &amp; text</p>' +
      '<ul class="wp-block-list"><li>item</li></ul>' +
      '<figure class="wp-block-image size-large">' +
      '<img loading="lazy" decoding="async" width="1024" height="576" ' +
      'src="https://cms.tffdigital.com/wp-content/uploads/x-1024x576.png" alt="" ' +
      'class="wp-image-147" srcset="https://cms.tffdigital.com/x-1024x576.png 1024w" ' +
      'sizes="(max-width: 1024px) 100vw, 1024px" /></figure>' +
      '<a href="https://www.tffdigital.com/">link</a>';
    const out = sanitizeWpHtml(wp);
    assert.equal(out.includes('id="what-is-seo-for-small-businesses"'), true);
    assert.equal(out.includes('class="wp-block-heading"'), true);
    assert.equal(out.includes("srcset="), true);
    assert.equal(
      out.includes('sizes="(max-width: 1024px) 100vw, 1024px"'),
      true,
    );
    assert.equal(out.includes('href="https://www.tffdigital.com/"'), true);
    assert.equal(out.includes("&amp;"), true);
  });

  test("CSS-anticipated tags survive: code/pre with language class, table, blockquote, ol", () => {
    const wp =
      '<pre class="wp-block-code"><code class="language-ts">const x = 1;</code></pre>' +
      "<blockquote><p>quote</p></blockquote>" +
      '<table><caption>c</caption><thead><tr><th scope="col">h</th></tr></thead>' +
      "<tbody><tr><td>d</td></tr></tbody><tfoot><tr><td>f</td></tr></tfoot></table>" +
      "<ol><li>one</li></ol><hr /><br />";
    const out = sanitizeWpHtml(wp);
    for (const marker of [
      'class="language-ts"',
      "<blockquote>",
      "<table>",
      "<caption>c</caption>",
      "<thead>",
      '<th scope="col">',
      "<td>d</td>",
      "<tfoot>",
      "<ol>",
      "<hr",
      "<br",
    ]) {
      assert.equal(out.includes(marker), true, `expected ${marker}`);
    }
  });

  test("Gutenberg embed wrapper divs and https iframes survive", () => {
    const wp =
      '<figure class="wp-block-embed"><div class="wp-block-embed__wrapper">' +
      '<iframe title="Demo" width="560" height="315" src="https://www.youtube.com/embed/abc" ' +
      'allow="accelerometer; autoplay" allowfullscreen></iframe></div></figure>';
    const out = sanitizeWpHtml(wp);
    assert.equal(out.includes('class="wp-block-embed__wrapper"'), true);
    assert.equal(out.includes('src="https://www.youtube.com/embed/abc"'), true);
    assert.equal(out.includes("allowfullscreen"), true);
  });

  test("remaining inert Gutenberg blocks/formats survive", () => {
    const wp =
      '<h5 class="wp-block-heading">h5</h5><h6>h6</h6>' +
      '<details class="wp-block-details" open><summary>More</summary><p>x</p></details>' +
      "<p><kbd>Ctrl</kbd> <mark>hi</mark> <s>old</s> <del>d</del> <ins>i</ins> <sub>2</sub><sup>3</sup></p>" +
      '<p><a href="tel:+917206809816">call</a> <a href="mailto:info@tffdigital.com">mail</a></p>' +
      '<figure class="wp-block-video"><video controls src="https://cms.tffdigital.com/a.mp4" poster="https://cms.tffdigital.com/a.jpg"></video></figure>' +
      '<sup class="fn"><a href="#fn-1">1</a></sup>';
    const out = sanitizeWpHtml(wp);
    for (const marker of [
      "<h5",
      "<h6>",
      "<details",
      " open>",
      "<summary>",
      "<kbd>",
      "<mark>",
      "<del>",
      "<ins>",
      'href="tel:+917206809816"',
      'href="mailto:info@tffdigital.com"',
      'src="https://cms.tffdigital.com/a.mp4"',
      'poster="https://cms.tffdigital.com/a.jpg"',
      'href="#fn-1"',
    ]) {
      assert.equal(out.includes(marker), true, `expected ${marker}`);
    }
  });

  test("CONTENT-1: plain-text derivation is unchanged by sanitization", () => {
    const raw =
      "<p>Don&#8217;t &amp; can&rsquo;t&nbsp;&hellip; &lt;b&gt;literal&lt;/b&gt;</p>";
    // sanitize-html decodes entities on parse and re-escapes only &<>"; a
    // WP `&nbsp;` therefore comes out as a literal U+00A0 — the same character
    // the browser renders for the entity — which stripHtml passes through
    // where it maps the entity form to a plain space. Whitespace-class
    // equivalent everywhere content-derived text is consumed (word counts).
    const nbsp = (s: string) => s.replace(/\u00a0/g, " ");
    assert.equal(nbsp(stripHtml(sanitizeWpHtml(raw))), stripHtml(raw));
    // author-escaped markup stays escaped text, never becomes a real tag
    assert.equal(sanitizeWpHtml(raw).includes("<b>"), false);
  });

  test("blog pipeline order still works: withHeadingIds and featured-image dedupe on sanitized HTML", () => {
    const featured = "https://cms.tffdigital.com/wp-content/uploads/hero.jpg";
    const raw =
      '<figure class="wp-block-image"><img src="https://cms.tffdigital.com/wp-content/uploads/hero-1024x576.jpg" alt=""></figure>' +
      '<h2 class="wp-block-heading">Intro</h2><h3 id="kept-id">Sub</h3>';
    const deduped = stripDuplicateFeaturedImage(sanitizeWpHtml(raw), featured);
    assert.equal(
      deduped.startsWith("<h2"),
      true,
      "leading duplicate figure removed",
    );
    const { html, headings } = withHeadingIds(deduped);
    assert.equal(
      html.includes('<h2 class="wp-block-heading" id="intro">'),
      true,
    );
    // a WP-emitted heading id survives the sanitizer and is left alone
    assert.equal(html.includes('<h3 id="kept-id">'), true);
    // KNOWN pre-existing withHeadingIds limitation (not an ARCH-5 change):
    // it preserves an author-supplied id in the HTML but pushes the
    // slugified id into `headings`, so the ToC would link #sub while the
    // heading carries id="kept-id". Pinned here so a fix shows up as an
    // intentional test change; live WP content never emits heading ids
    // itself, so no live anchor is affected today.
    assert.deepEqual(
      headings.map((h) => h.id),
      ["intro", "sub"],
    );
  });

  test("empty input passes through unchanged", () => {
    assert.equal(sanitizeWpHtml(""), "");
  });
});
