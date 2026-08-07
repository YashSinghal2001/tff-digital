# Step 4 — Final SEO + Accessibility + Performance QA

## 1. Baseline

- Branch `main`, HEAD `2bbc1f1` at start.
- Pre-existing working tree (from Steps 2–3) preserved exactly: 6 modified files
  (`docs/contact-information-audit.md`, `next.config.ts`,
  `src/components/blog/BlogSearch.tsx`, `src/components/layout/Footer.tsx`,
  `src/components/layout/Navbar.tsx`) + 5 untracked paths. Nothing reset or
  discarded.
- `npm run lint`: PASS (before and after this pass).
- `npm run build`: PASS (before and after), identical 14-route table, same
  rendering modes (static ○ for `/`, `/about`, `/contact`, `/services`,
  `/services/seo`, `/services/smm`, `/sitemap.xml`, `/robots.txt`; dynamic ƒ
  for `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/tag/[slug]`,
  `/case-studies`, `/case-studies/[slug]`, `/services/[slug]`).

## 2. SEO Audit (methodology: real rendered HTML, not source-code inference)

Every indexable route was curled against a real `next start` production server
and its actual `<head>` was parsed — title, description, canonical, robots,
OG/Twitter tags, viewport, JSON-LD. Static pages (`/`, `/about`, `/contact`,
`/services`, `/services/seo`, `/services/smm`, `/blog`, `/case-studies`) all
declare their own `title`/`description`/canonical directly; dynamic pages
(`/blog/[slug]`, `/case-studies/[slug]`, `/services/[slug]`) go through the
shared `buildMetadata()` helper fed by live WordPress SEO (Yoast) data.

**Genuine bug found and fixed**: the homepage (`/`) rendered `<title>Home</title>`
— no site name, unlike every other page which correctly shows `"X | TFF
Digital"`. Root-caused to a real, documented Next.js App Router behavior:
`title.template` (defined in `layout.tsx`) never applies to `page.tsx` in the
*same* route segment as the layout that defines it — and `app/page.tsx` (the
homepage) is exactly that segment. Every other page lives in its own
subdirectory (a different segment), so the template correctly applies there.
Fixed by having the homepage set its title explicitly to `seoConfig.defaultTitle`
("TFF Digital") rather than relying on template inheritance that mechanically
cannot reach it.

All other static pages: correct title/description/canonical, no fabricated
content — descriptions are the same real, already-approved copy used
elsewhere on the site (not new copy written for this pass).

## 3. Dynamic Metadata Audit

Checked `generateMetadata` in `blog/[slug]`, `case-studies/[slug]`,
`services/[slug]`, `blog/category/[slug]`, `blog/tag/[slug]` against real live
content (`hello-world` post, `test` case study, all 7 live services including
`ai-consulting`, whose content fields are entirely empty).

- Titles: sourced from Yoast (`wpSeo.title`) with a real-content fallback,
  passed through `buildMetadata()`'s `{ absolute: title }` bypass so the
  layout's `%s | TFF Digital` template never double-appends the site name
  Yoast titles already include. Verified live: `"Hello World Live - TFF
  Digital"`, `"Test - TFF Digital"`, `"AI Consulting Updated - TFF Digital"`
  — single suffix, no duplication, even for the fully-empty service.
- Descriptions: real content or the shared site-default fallback — never
  `undefined`/`null` literal text in any rendered `<meta>` tag (verified via
  a strictly-scoped grep against actual tag content, not the wider page HTML
  which does contain the literal strings `null`/`undefined` deep inside
  React's unrelated RSC hydration payload — that's normal framework internals,
  not a metadata leak, and was explicitly ruled out as a false read).
- Canonicals: all resolve to `https://tffdigital.com/...` — no localhost, no
  double slashes, no wrong slug.
- **Fragility identified, not a live bug**: WordPress's own Yoast `canonical`
  field returns WordPress's *native* permalink structure (confirmed live:
  `https://tffdigital.com/service/ai-consulting/`, `/case-study/test/`,
  `/hello-world/` — completely different paths from this frontend's actual
  URLs). `adaptSeo()` would use that wrong value if nothing else were
  provided. Every one of the 5 dynamic `generateMetadata` functions correctly
  passes an explicit `getCanonicalUrl(...)` override to `buildMetadata()`,
  which takes priority — confirmed this defends correctly in the actual
  rendered output. Not a live bug (100% currently correct), but noted as a
  fragile pattern for awareness: a future new dynamic route that forgets this
  explicit override would silently leak WordPress's own URL as the canonical.

## 4. Canonical / URL Consistency

All canonicals checked resolve to the production host, no trailing-slash
inconsistency, no query strings, no duplicate `<link rel="canonical">` tags
(exactly one per page). `metadataBase` is set once in the root layout from
`NEXT_PUBLIC_SITE_URL` (`https://tffdigital.com` in the production env file),
and `getCanonicalUrl()` uses the `URL` constructor (safe against malformed
joins). No site-URL configuration changes were necessary or made.

## 5. Sitemap + Robots

Re-verified (no changes from Step 3's audit): `/sitemap.xml` lists 17 unique,
valid, all-`200` URLs (8 static + 1 blog post + 1 case study + 7 services).
`/robots.txt` correctly allows all and references the sitemap. Live WordPress
`metaRobotsNoindex`/`metaRobotsNofollow` values confirmed to resolve to
`index, follow` on every piece of live content — no accidental noindex on
anything currently published. No sitemap defect found; nothing changed.

## 6. Structured Data / JSON-LD (parsed from real rendered `<script>` tags)

`Organization` + `WebSite` (root layout), `BlogPosting` + `BreadcrumbList`
(blog detail), `CreativeWork` + `BreadcrumbList` (case study detail),
`BreadcrumbList` (service detail) — all valid, parseable JSON, correct
`@context`/`@type`/`@id`, no literal `undefined`/`null` values (optional
fields correctly omitted via `JSON.stringify` dropping real JS `undefined`).
The existing `<` → `<` XSS-hardening escape in `JsonLd.tsx` was verified
intact and **not touched**, per instruction.

**Genuine bug found and fixed**: `BlogPosting.description` (from
`post.excerpt`) rendered raw HTML — `"...<p>hey, How are you ? I
hope you are doing good.</p>\n"` — a schema.org/Google structured-data
best-practice violation (text fields must be plain text). This is the exact
same class of bug already fixed for the `<meta description>` tag in
`src/adapters/seo.adapter.ts` (`stripHtml()`), but that fix only covered the
meta-tag code path — `json-ld.ts` builds its description directly from
`post.excerpt`/`caseStudy.summary`/`caseStudy.excerpt` independently and was
never covered. Fixed by adding a `cleanText()` helper (`stripHtml()` +
whitespace collapse + trim, matching the adapter's exact existing pattern) to
both `buildBlogPostingJsonLd` and `buildCaseStudyJsonLd`. Verified live:
`"description":"hey, How are you ? I hope you are doing good."` — clean plain
text.

Not added (documented, not a defect): `FAQPage` schema for the FAQ accordion
(appears on 5 different pages with no existing JSON-LD wiring pattern to
extend) and `Service`-type schema on service detail pages. Both are real,
legitimate SEO *opportunities*, not bugs — nothing is broken or malformed
today because neither exists. Adding either is new-feature-scale structured
data wiring across multiple pages, which falls outside "fix only objectively
wrong issues" and into enhancement territory. Recommended as a candidate for
a future, explicitly-scoped pass — see §14.

## 7. Accessibility Audit

Real rendered HTML + live browser keyboard/DOM interaction (not just source
reading).

- **Heading hierarchy**: exactly one `<h1>` per page confirmed on all 9 pages
  checked. **Genuine bug found and fixed**: `/case-studies` skipped H1 → H3
  (card titles are `<h3>`, no H2 in between) — every other listing page
  (`/services`, `/blog`) has a visually-hidden `<h2>` bridging the gap,
  established via the exact same `sr-only` pattern already used in
  `ServicesGrid.tsx`. Added a matching `<h2 className="sr-only">Case
  studies</h2>` to `case-studies/page.tsx` for consistency — no visual
  change.
- **Landmarks**: `<header>`, `<nav>`, `<main>`, `<footer>` all present and
  correctly used on every page.
- **Genuine bug found and fixed**: no skip-to-content link existed anywhere
  — keyboard users had to tab through the entire header (~9 stops: logo,
  7 nav links, CTA button, hamburger) on every single page load before
  reaching page content (WCAG 2.4.1 Bypass Blocks). Added a standard,
  visually-hidden-until-focused "Skip to main content" link as the first
  focusable element in `layout.tsx`, targeting a new `id="main-content"` +
  `tabIndex={-1}` on `<main>` (the `tabIndex={-1}` ensures activating the
  link also *moves keyboard focus* to main content, not just scroll position
  — verified live: `document.activeElement` correctly becomes
  `MAIN#main-content` after activation). No visual change on any page for
  mouse/touch users; the link is genuinely invisible until keyboard-focused.
- **Genuine bug found and fixed**: `Input`, `Textarea`, and `Select` (the
  three shared primitives behind the Contact form) all had a correctly
  `htmlFor`-associated `<label>`, but the validation error message
  (`<p className="text-sm text-red-400">`) had no programmatic association
  with its field — no `aria-describedby`, no `aria-invalid`. A screen reader
  user focusing an invalid field got no indication anything was wrong beyond
  the visual red border. Fixed by adding `aria-invalid` + `aria-describedby`
  (pointing to a new `id={fieldId}-error` on the error `<p>`) to all three
  components. Verified live on the real Contact form:
  `aria-invalid="true"`, `aria-describedby="name-error"`, resolving to a real
  element containing "Name must be at least 2 characters".
- **Focus visibility**: confirmed present and functional site-wide in Step 2
  (native/`focus-visible:ring-2` pattern), re-spot-checked here, no
  regressions.
- **Mobile menu keyboard/ARIA semantics**: `aria-label` toggles correctly
  between "Open menu"/"Close menu" (`Navbar.tsx`, unchanged from Step 2's
  scroll-lock/backdrop fixes). Not re-litigated here since it was already
  fixed and verified in Step 2.
- **Accordion semantics (FAQ)**: `aria-expanded`, `aria-controls`, matching
  `id`s already correctly wired (`FAQ.tsx`) — verified again live, no change
  needed.
- **Alt text**: re-confirmed from Step 3's exhaustive image audit — every
  `next/image` usage has a real fallback (`alt={x.altText || fallbackText}`),
  never empty/missing. Decorative icons consistently use `aria-hidden="true"`
  (spot-checked across `FeatureGrid`, `Pagination`, `ShareButtons`, `FAQ`).
- **Color contrast** (calculated via WCAG relative-luminance formula against
  the real design-token hex values in `src/styles/tokens.css`, not
  estimated): body text `#d8d8d8` on background `#0c1025` = **13.2:1**; white
  text = **18.81:1**; primary blue `#3882f6` = **5.1:1**; error red `#f87171`
  = **6.8:1** — all comfortably pass WCAG AA (and mostly AAA). **Found, not
  fixed** (documented as a design decision, not a code bug): white button
  text (`text-sm`/14px, `font-semibold`) on the primary gradient CTA button
  measures **3.69:1** against the purple end of the gradient (`#8b5cf6`) —
  below the 4.5:1 AA threshold for text under 18.66px-bold. This is an
  intentional, consistent, site-wide brand color choice (the same
  blue-to-purple gradient button appears identically on every single page),
  not an isolated/accidental bug — fixing it means changing brand colors,
  which is a visual/design decision explicitly out of this pass's scope
  ("do not redesign the interface," "no subjective visual preferences").
  Flagged for the client's designer to weigh in on, not changed unilaterally.
- **Tab order**: verified logical (skip link → header nav → page content →
  footer) via live keyboard testing; no `tabindex` values other than the new,
  intentional `-1` on `<main>` exist anywhere in the codebase.

## 8. Performance Audit (code-level)

- `next/image` used exclusively (zero raw `<img>`, zero CSS `background-image`)
  — reconfirmed from Step 3.
- `priority` usage audited across every call site: correctly limited to (a)
  the first card (`index === 0`) in each listing grid, and (b) the actual
  hero/LCP image on each of the three detail-page types. No blanket/excess
  `priority` found — no fix needed, already correctly tuned.
- Fonts: both `Poppins` and `Open_Sans` load via `next/font/google` with
  `display: "optional"` — self-hosted at build time (confirmed via the CSP
  `font-src 'self'` directive, no runtime `fonts.gstatic.com` request), and
  `display: "optional"` is a deliberate, already-good CLS-minimizing choice
  (browser only uses the custom font if it's ready within ~100ms, otherwise
  permanently falls back rather than causing a later layout shift). Not
  changed.
- Client/server component boundaries: audited every `"use client"` directive
  (39 files). Two components (`RelatedServices.tsx`, `ServicesGrid.tsx`)
  initially looked like candidates for unnecessary client-side marking (no
  obvious `useState`/`onClick` in a keyword scan), but both carry an existing
  code comment explaining the real, legitimate reason — resolving a
  `LucideIcon` *function* reference, which cannot cross the server→client RSC
  boundary as a prop into `FeatureGrid` (itself client-side for Framer
  Motion). Confirmed correct, not fixed.
- No third-party scripts anywhere in the codebase (grepped for
  `next/script`, `gtag`, `googletagmanager` — zero matches; only a code
  comment about a *future* analytics feature, not yet built).
- No duplicate/redundant GraphQL fetches found on any audited page.

## 9. Real Browser Measurements

Measured via the Performance/PerformanceObserver APIs on a real `next start`
production server (not simulated, not fabricated Lighthouse numbers — no
Lighthouse run was performed, and none of its scores are reported here).

- **CLS**: `0` on `/`, `/services/web-development`, and `/blog/hello-world`
  (measured via a `layout-shift` `PerformanceObserver` with `buffered: true`,
  excluding shifts with `hadRecentInput`). Genuine, reliable measurement —
  this API doesn't depend on tab visibility.
- **Navigation timing** (homepage): TTFB 44ms, DOMContentLoaded 112ms,
  domComplete 200ms. These are local-loopback numbers (client and server on
  the same machine) — not representative of real-world production latency
  over the internet, but they do confirm no code-level blocking/slow-request
  issue exists server-side.
- **Resource count** (homepage): 19 total requests (6 font/CSS preloads + 13
  JS chunks), zero requests over 100ms, zero image requests (no live content
  currently has a featured image — a WordPress content gap already documented
  in Step 3, not a Step 4 concern).
- **LCP/FCP: could not be reliably measured in this environment.** Diagnosed
  the exact cause rather than reporting a fabricated or misleading number:
  `document.hidden` is `true` and `document.visibilityState` is `"hidden"`
  for the automated browser tab used in this session — Chrome suppresses
  paint-timing APIs (`first-paint`, `first-contentful-paint`,
  `largest-contentful-paint`) for tabs without OS-level foreground focus,
  which this automation harness does not grant. `performance.getEntriesByType('paint')`
  returned an empty array even after the page fully loaded
  (`document.readyState === "complete"`). This is a genuine environment
  constraint, not a site defect — stated clearly rather than guessed at or
  substituted with an invented number.
- Desktop (1440/1280) vs. mobile (390/375) viewport-specific performance
  differences were not separately measurable beyond what's reported above,
  for the same LCP-measurement reason; CLS and navigation timing were
  confirmed viewport-independent (they don't depend on paint visibility).

## 10. Issues Found

1. Homepage `<title>` missing site name — SEO/branding. Fixed.
2. JSON-LD `description` contains raw HTML — structured-data correctness.
   Fixed.
3. `/case-studies` heading hierarchy skip (H1 → H3) — accessibility. Fixed.
4. No skip-to-content link anywhere — accessibility (WCAG 2.4.1). Fixed.
5. Form error messages not programmatically associated with their fields —
   accessibility (WCAG 3.3.1/4.1.2). Fixed.
6. Button text contrast on the gradient CTA (~3.69:1) — found, documented,
   **not fixed** (design decision, out of scope).
7. Missing `FAQPage`/`Service` structured data — found, documented as a
   recommendation, **not fixed** (feature addition, not a defect).
8. WordPress-canonical fragility in `adaptSeo()` — found, documented, **not
   fixed** (nothing is currently broken; all 5 call sites already guard
   correctly).

## 11. Issues Fixed

| # | File | Change |
|---|---|---|
| 1 | `src/app/page.tsx` | `title: "Home"` → `title: seoConfig.defaultTitle` |
| 2 | `src/lib/seo/json-ld.ts` | Added `cleanText()` (stripHtml + trim), applied to `BlogPosting`/`CreativeWork` descriptions |
| 3 | `src/app/case-studies/page.tsx` | Added `<h2 className="sr-only">Case studies</h2>` before the card grid |
| 4 | `src/app/layout.tsx` | Added skip-to-content link; added `id="main-content"` + `tabIndex={-1}` to `<main>` |
| 5 | `src/components/ui/Input.tsx`, `Textarea.tsx`, `Select.tsx` | Added `aria-invalid` + `aria-describedby` wired to a new `id` on the error message |

All five verified via real browser interaction post-fix (not just re-reading
source), documented in §7 above.

## 12. Files Changed

`src/app/page.tsx`, `src/lib/seo/json-ld.ts`, `src/app/case-studies/page.tsx`,
`src/app/layout.tsx`, `src/components/ui/Input.tsx`,
`src/components/ui/Textarea.tsx`, `src/components/ui/Select.tsx`, plus this
new doc.

## 13. Files Intentionally Untouched

WordPress content/data, `wordpress-plugin/`, the Lead API (`actions.ts`,
`contact.service.ts`), `next.config.ts`'s CSP/security headers, `sitemap.ts`,
`robots.ts`, the JSON-LD `<` escaping in `JsonLd.tsx` (explicitly required to
remain intact — confirmed unchanged), any brand/gradient colors, any page
copy beyond the one-line homepage title fix (which reuses existing
`seoConfig.defaultTitle`, not new content).

## 14. Remaining Blockers / Recommendations (not fixed, with reasons)

| Item | File(s) | Why not fixed now | Owner |
|---|---|---|---|
| Button text contrast (~3.69:1) on primary gradient CTA | `button-variants.ts` | Requires a brand-color decision; visual/design scope, not a code defect | Client / designer |
| No `FAQPage` structured data | `FAQ.tsx` + 5 call sites | New structured-data feature across multiple pages, not a fix to something broken | Future SEO phase |
| No `Service` schema on service detail pages | `services/[slug]/page.tsx` | Same as above — enhancement, not a defect | Future SEO phase |
| WordPress-canonical fragility if a future page forgets the explicit override | `adaptSeo()` / any new dynamic route | Nothing is currently broken; a preemptive refactor wasn't requested and risks over-engineering a currently-correct pattern | Note for future dev work |
| LCP/FCP not measurable in this session | N/A (environment) | Automated tab lacks OS-level foreground focus; Chrome suppresses paint-timing APIs for hidden tabs. Would need a differently-configured testing environment (real Lighthouse CI, or a tab genuinely in focus) to measure | Future tooling/CI setup |
| Zero content images anywhere (all live WP content has no featured image) | WordPress content | Already documented in Step 3; unchanged, requires content upload | Client / WP editor |

## 15. `npm run lint`

PASS, before and after every fix in this pass (checked incrementally after
each edit batch, and once more at the end).

## 16. `npm run build`

PASS, before and after. Route table identical throughout — same 14 routes,
same static/dynamic split, same bundle sizes (±0.1kB from the JSON-LD helper
addition).

## 17. Production Verification

Full `next start` restart after all fixes. Re-verified live: all 13 routes in
the regression list return `200`; homepage `<title>` is now `"TFF Digital"`;
JSON-LD blog description is clean plain text; case-studies listing has the
new `sr-only` H2; skip link is present, correctly hidden by default, becomes
visible and correctly sized on keyboard focus, and moving focus + scroll to
`<main>` on activation; Contact form's invalid fields correctly expose
`aria-invalid`/`aria-describedby` resolving to real error text; zero console
errors on every page re-checked; CLS still `0`; security headers
(CSP/X-Frame-Options/etc.) unchanged and intact.
