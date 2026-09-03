# PHASE 2 — FINAL DEEP SEO / METADATA / INDEXABILITY RE-AUDIT

**Audit Date:** 2026-09-02
**Scope:** SEO architecture, metadata generation, canonicals, Open Graph, Twitter Cards, JSON-LD, sitemap, robots.txt, indexability, blog/case-study/service SEO, content sanitization inside SEO fields, duplicate content, and production-vs-repo consistency. Verification-only — nothing modified.
**Repository State:** `tff-digital @ main`, `0ff429c8b1bdfc254c31de6860c972f6f7ee4e91` — unchanged before, during, and after this audit (re-verified, see §17).
**Method:** Independent re-derivation, not a copy of prior conclusions. Five research passes (this orchestrating pass + four parallel sub-audits) combined direct source reading, real command execution, and **live, read-only HTTP/GraphQL requests against `https://www.tffdigital.com` and `https://cms.tffdigital.com` run today (2026-09-02)** — including two temporary local dev-server checks (started and killed read-only, no files touched) used to empirically verify specific Next.js metadata-inheritance behavior rather than trust a code comment's claim about it. Where a live result and a prior document disagreed, the live result won and the prior text is marked accordingly below.

---

## 1. Executive Summary

**No regressions found.** Every specific "previous fix" the audit brief asked to re-verify — title double-suffix prevention, `og:url` construction logic, HTML stripping in meta descriptions, `datePublished`/`dateModified` population, sitemap `lastModified` correctness, the default SEO description, canonical behavior, www-domain consistency, and OG-field inheritance — is still present and functioning. Two of these are *more* thoroughly verified now than before (empirically tested live/locally, not just read as code), and none show evidence of having broken since the master audit or Phase 1.

**The master audit's one P0 (SEO-1) is reconfirmed live, unchanged, 2026-09-02:** all 10 real WordPress-authored pages (2 case studies, 7 services, 1 blog post) still serve `noindex, nofollow`, while the sitemap still lists 3 of them as indexable. This remains a WordPress/Yoast setting, not a code defect — no code path in this repository sets that directive; it's read straight from Yoast's own field.

**The most consequential thing this pass found that wasn't previously documented:** `og:url` is **completely absent on all 13 statically-defined pages** — homepage, `/about`, `/services`, `/services/seo`, `/services/smm`, `/blog`, `/blog/category/[slug]`, `/case-studies`, `/contact`, both legal pages, and the 404 page. It's present and correct only on the three WordPress-backed dynamic detail routes. Root cause identified precisely (§4, **OG-1**): these pages define a plain `metadata` object literal and never call the shared `buildMetadata()` helper; `buildMetadata()` itself only constructs its `openGraph` block — url included — when a truthy WordPress `seo` object is passed in (`metadata.ts:44`), a condition only the three dynamic routes ever satisfy; the root layout's own `openGraph` default has no `url` field either, so nothing is left to inherit. This affects social-share link previews on every major marketing page of the site, including the homepage.

**Second most significant finding:** `stripHtml()`/`htmlToPlainText()` strip HTML tags but never decode HTML entities. This is **live and visible in production today** (§15, **CONTENT-1**): the real blog post's excerpt renders the literal text `[…]` as `[&hellip;]` inside both the visible `PostCard` on `/blog` and the page's own JSON-LD `description` field. Low severity (cosmetic text-quality only, no function/indexability/security impact) but genuinely live, not theoretical.

**Security check requested explicitly by this audit (§6):** whether JSON-LD's `dangerouslySetInnerHTML` embed is safe against a WordPress-authored `<` character terminating the enclosing `<script>` tag early. **Classification: safe as implemented**, verified with full reasoning, not asserted — see §8.

**Scorecard (this phase's scope only):** 1 P0 (reconfirmed, not new) · 1 P1 (reconfirmed, not new) · 4 P2 (2 new: OG-1, SITEMAP-1, CONTENT-1; 1 reconfirmed with new live detail: CMS-9/service-test-content; 1 reconfirmed unchanged: og:type-family scope) · 12 P3 · 2 INFO/content-only.

---

## 2. Current Git/Deployment Baseline

| Item | Value | Status |
|---|---|---|
| Branch / HEAD | `main` @ `0ff429c8b1bdfc254c31de6860c972f6f7ee4e91` (2026-09-01 22:29:44 +0530) | VERIFIED, unchanged since Phase 1 |
| git status | Same 9 pre-existing `docs/*.md` deletions + untracked `docs/TFF_DIGITAL_MASTER_AUDIT.md`, now also the untracked `PHASE_1_...md` report. Zero new drift. | VERIFIED |
| Next.js / React / TypeScript | 15.5.22 / 19.1.0 / 5.9.3 | VERIFIED, matches Phase 1 exactly (HEAD hasn't moved, so it couldn't have changed) |
| Production vs. repository | **Directly re-verified live this pass** (stronger than Phase 1's carried-forward claim) — the code's own predicted behavior (og:url present on exactly the 3 WordPress-backed dynamic routes and absent on exactly the 13 static ones, noindex on exactly the 10 real WP content pages, sitemap containing exactly 13 URLs matching `sitemap.ts`'s logic) matched live production output precisely across dozens of live requests. This consistency is itself strong evidence the deployed build reflects current HEAD. | VERIFIED live, 2026-09-02 |

---

## 3. Complete Route Matrix

Real slugs discovered live: Case Studies = `stabilizing-and-scaling-seo-for-a-dutch-ecommerce-website` (**ChicaBebo**, confirmed by on-page content) and `unlocking-untapped-seo-potential-through-structured-optimization` (**RoyaltyMirror**, confirmed by on-page content, mentions the client name directly). Real Services (via public WP REST) = `ai-consulting`, `digital-marketing`, `wordpress-development`, `ai-automation`, `seo-optimization`, `ui-ux-design`, `web-development`. Blog = `seo-for-small-businesses`.

| Route | Status | Title | Canonical | Robots Meta | OG url present? | og:type | JSON-LD types | Sitemap? | Indexable? |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 200 | TFF Digital \| Digital Growth Agency | `.../` | *(none → index)* | **Missing (OG-1)** | website | Organization, WebSite | Yes | INDEX |
| `/about` | 200 | About \| TFF Digital | `.../about` | *(none)* | **Missing (OG-1)** | website | Organization, WebSite | Yes | INDEX |
| `/services` | 200 | Services \| TFF Digital | `.../services` | *(none)* | **Missing (OG-1)** | website | Organization, WebSite | Yes | INDEX |
| `/services/seo-optimization` (real WP) | 200 | SEO Optimization - TFF Digital | `.../services/seo-optimization` | **noindex, nofollow** | Present | website | +BreadcrumbList | **No** | **NOINDEX** |
| `/services/ai-consulting` (real WP) | 200 | AI Consulting Updated - TFF Digital | `.../services/ai-consulting` | **noindex, nofollow** | Present | website | +BreadcrumbList | **No** | **NOINDEX** |
| `/services/seo` | 200 | SEO \| TFF Digital | `.../services/seo` | *(none)* | **Missing (OG-1)** | website | Organization, WebSite | Yes | INDEX |
| `/services/smm` | 200 | Social Media Marketing \| TFF Digital | `.../services/smm` | *(none)* | **Missing (OG-1)** | website | Organization, WebSite | Yes | INDEX |
| `/blog` | 200 | Blog \| TFF Digital | `.../blog` | *(none)* | **Missing (OG-1)** | website | +BreadcrumbList | Yes | INDEX |
| `/blog/seo-for-small-businesses` | 200 | SEO for Small Businesses: Get Found on Google | `.../blog/seo-for-small-businesses` | **noindex, nofollow** | Present | website (**OG-2**, should be `article`) | +BlogPosting, BreadcrumbList | Yes | **NOINDEX** |
| `/blog/category/seo` | 200 | SEO articles \| TFF Digital | `.../blog/category/seo` | *(none)* | **Missing (OG-1)** | website | +BreadcrumbList | **No (SITEMAP-1)** | INDEX |
| `/case-studies` | 200 | Case Studies \| TFF Digital | `.../case-studies` | *(none)* | **Missing (OG-1)** | website | +BreadcrumbList | Yes | INDEX |
| `/case-studies/…dutch-ecommerce-website` (ChicaBebo) | 200 | Stabilizing and Scaling SEO for a Dutch eCommerce Website - TFF Digital | `.../case-studies/stabilizing-…` | **noindex, nofollow** | Present | website (**OG-2**) | +CreativeWork, BreadcrumbList | Yes | **NOINDEX** |
| `/case-studies/…structured-optimization` (RoyaltyMirror) | 200 | Unlocking Untapped SEO Potential Through Structured Optimization - TFF Digital | `.../case-studies/unlocking-…` | **noindex, nofollow** | Present | website (**OG-2**) | +CreativeWork, BreadcrumbList | Yes | **NOINDEX** |
| `/contact` | 200 | Contact \| TFF Digital | `.../contact` | *(none)* | **Missing (OG-1)** | website | Organization, WebSite | Yes | INDEX |
| `/privacy-policy` | 200 | Privacy Policy \| TFF Digital | `.../privacy-policy` | *(none)* | **Missing (OG-1)** | website | Organization, WebSite | Yes | INDEX |
| `/terms-and-conditions` | 200 | Terms & Conditions \| TFF Digital | `.../terms-and-conditions` | *(none)* | **Missing (OG-1)** | website | Organization, WebSite | Yes | INDEX |
| `/services/[bad-slug]` | 404 | Page not found \| TFF Digital | none | noindex | — | — | none | No | NOINDEX |
| `/case-studies/[bad-slug]` | 404 | Page not found \| TFF Digital | none | noindex | — | — | none | No | NOINDEX |
| `/blog/[bad-slug]` | 404 | **"TFF Digital"** — inconsistent (reconfirms master audit SEO-5) | none | noindex | — | — | none | No | NOINDEX |

`X-Robots-Tag` HTTP header: **absent on every single route tested**, indexable or not (**IDX-1**) — the robots directive is carried exclusively by the HTML `<meta>` tag, standard Next.js Metadata API behavior.

**Duplicate-content/canonicalization vectors (live):**

| Test | Result |
|---|---|
| `http://www.tffdigital.com/` | 308 → `https://www.tffdigital.com/` (1 hop) |
| `http://tffdigital.com/` (apex, http) | 308 → `https://tffdigital.com/` → 301 → `https://www.tffdigital.com/` (**2 hops** — reconfirms master audit INFRA-4, unchanged) |
| `https://tffdigital.com/` (apex, https) | 301 → `https://www.tffdigital.com/` (1 hop) |
| `https://www.tffdigital.com/about/` (trailing slash) | 308 → `/about` (clean) |
| `.../?utm_source=phase2test&foo=bar` | 200, canonical correctly strips to bare URL, `x-vercel-cache: STALE` (ISR correctly ignores query string) |

---

## 4. Metadata Audit

Pipeline traced in full: `site.config.ts` → `seo.config.ts` → `layout.tsx` (metadataBase, title template, layout-level OG/Twitter defaults) → `seo.adapter.ts` (`adaptSeo()`) → `metadata.ts` (`buildMetadata()`) → each route.

#### OG-1 — `og:url` completely absent on all 13 statically-defined pages
- **Category:** C. Medium Priority Bug — **Priority: P2**
- **What:** No static page (home, about, services listing, both bespoke service pages, blog listing, blog category pages, case-studies listing, contact, both legal pages) ever renders an `og:url` meta tag. Only the 3 WordPress-backed dynamic detail routes (`/blog/[slug]`, `/case-studies/[slug]`, `/services/[slug]`) have it.
- **Where:** Confirmed by direct read, not inference. `src/app/about/page.tsx:13`, `src/app/contact/page.tsx:8`, `src/app/services/page.tsx:59` (and the same pattern for every other static page) each define a plain `export const metadata: Metadata = {...}` object literal — **none of them call `buildMetadata()`**. `src/lib/seo/metadata.ts:44-61` gates the entire `metadata.openGraph` assignment (including `url: resolvedCanonical` at line 53) behind `if (seo)` — only WordPress-backed callers ever pass a truthy `seo` argument. The root layout's own `openGraph` default (`src/app/layout.tsx:36-48`) sets `siteName`/`type`/`locale`/`images` only — no `url` field — so there's nothing for a static page to inherit either.
- **Why:** Not a regression — this appears to be how static-page metadata was built from the start, simply never noticed because `og:title`/`og:description` correctly inherit from the layout via a *different*, working mechanism (Next.js's own title/description-to-OG fallback, confirmed sound in §4's positive findings below) while `url` has no equivalent fallback anywhere in the Metadata API.
- **Impact:** Every social share of the homepage, About, Services listing, Contact, or either legal page currently has no `og:url`. Some platforms (notably Facebook/LinkedIn's scrapers) use `og:url` as the canonical identity for a shared link's engagement count and preview cache; its absence means shares of these pages fall back to the browser-bar URL, which is usually fine but is a real, silent gap on a marketing site's highest-traffic pages (homepage included).
- **Recommended action:** Either (a) add an explicit `openGraph: { url: <page's own absolute URL> }` to each static page's metadata object, or (b) migrate static pages onto `buildMetadata()` and change its `if (seo)` gate so the `openGraph` block (or at least the `url`/title/description fields) can be constructed whenever `resolvedCanonical` exists, independent of whether WordPress `seo` data is present.
- **Owner:** Claude can fix.
- **Effort:** Low (13 one-line additions) to Medium (option b, touches shared helper + all static pages).
- **Risk:** Low.

#### OG-2 — `og:type` hardcoded to `"website"` for every content type (widens master audit SEO-4)
- **Category:** D. Low Priority Bug — **Priority: P3**
- **What:** `src/adapters/seo.adapter.ts:53` — `type: "website"` is a single unconditional literal inside `adaptSeo()`, used identically for blog posts, case studies, and services. Master audit's SEO-4 scoped this to the blog post only (`og:type` should be `article`); live checks this pass confirm **all three WordPress-backed content types** render `og:type: website`, including the two `CreativeWork`-typed case studies.
- **Where:** `seo.adapter.ts:53`; live-confirmed on all 3 real dynamic routes.
- **Recommended action:** Make `type` conditional on content type (`article` for blog posts, `website` remains fine for case studies/services since OG has no dedicated "case study" type).
- **Owner:** Claude can fix. **Effort:** Low. **Risk:** None.

#### META-1 — Duplicate `<meta name="robots">` tag on every 404 page
- **Category:** D. Low Priority Bug — **Priority: P3**
- **What:** `src/app/not-found.tsx:10` sets `robots: { index: false, follow: false }` (renders `noindex, nofollow`). Empirically confirmed (local dev server, killed after) that Next.js **also** auto-injects its own `<meta name="robots" content="noindex">` for any 404-status response, independent of page metadata — so the rendered HTML carries two separate robots meta tags. Net effective directive is unaffected (both agree on `noindex`), but it's genuinely duplicate markup.
- **Where:** `not-found.tsx:8-11`; empirically verified via local render.
- **Recommended action:** Low value to fix — Next's auto-injection can't be suppressed without side effects, and the duplicate is harmless to crawlers. Document as expected Next.js behavior.
- **Owner:** Claude can fix (cosmetic) or leave. **Effort:** Trivial. **Risk:** None.

#### CANON-1 — Canonical `??` operator doesn't treat WordPress's empty-string canonical as absent (latent footgun)
- **Category:** H. Improvement (not live) — **Priority: P3**
- **What:** `seo.adapter.ts:48` — `canonicalUrl: wpSeo?.canonical ?? fallback.canonicalUrl ?? null`. Master audit's CMS-7 already established `wpSeo.canonical` is always a live empty string (`""`), never null/undefined, on every WordPress content type. `??` doesn't treat `""` as absent, so this line always resolves to `""` and never falls through to `fallback.canonicalUrl`.
- **Why it's not live today:** All 3 dynamic-route callers (`blog/[slug].tsx`, `case-studies/[slug].tsx`, `services/[slug].tsx`) explicitly pass their own `getCanonicalUrl(...)` as `buildMetadata()`'s first-priority `canonicalUrl` argument, which wins regardless. Confirmed correct on all 3 routes live.
- **Impact:** A genuine footgun for any *future* page that calls `buildMetadata()` without explicitly passing `canonicalUrl` — it would silently receive `resolvedCanonical = ""`, which is falsy, so `metadata.ts:40`'s `if (resolvedCanonical)` guard would skip `alternates.canonical` entirely, producing a page with **no canonical tag at all**, silently. Master audit's own prose already flagged this exact fragility as "worth a code comment" — confirmed today that no such comment exists at this specific line.
- **Recommended action:** Change `??` to `||` at `seo.adapter.ts:48` (or normalize the empty string to `null` before this line).
- **Owner:** Claude can fix. **Effort:** Trivial. **Risk:** None.

#### Confirmed sound — no finding (empirically verified, not assumed)
- **Homepage title double-suffix:** `app/page.tsx:26-30`'s claim that a page sharing its layout's route segment bypasses the title template was verified empirically via local dev server render — rendered `<title>` is exactly `TFF Digital | Digital Growth Agency`, no duplication. **I. Working as Designed.**
- **OG/Twitter title+description inheritance on all 13 static pages:** verified empirically on `/about` and `/contact` — `og:title`/`og:description` correctly resolve from the page's own top-level `title`/`description` per Next's documented fallback, even though the layout's `openGraph` object sets neither directly. **I. Working as Designed.**
- **The previously-fixed `seo: null` metadata-stripping bug:** `metadata.ts:34-39`'s guard structure (add keys only when they carry a value, never explicit `undefined`) is correct and matches documented Next.js inheritance semantics. **I. Working as Designed, not regressed.**

---

## 5. Canonical Audit

Every route tested (static and dynamic) resolves through `getCanonicalUrl()` → `new URL(path, siteConfig.url)`, consistently `https://www.tffdigital.com/...`, zero trailing slashes, zero apex/http/CMS-domain/Vercel/localhost leakage — confirmed on 9+ distinct routes via live and local checks. WordPress's own Yoast `canonical` field is a live empty string sitewide (reconfirms master audit CMS-7) and — per the trace above — never actually reaches the final rendered canonical on any route that matters, because all 3 dynamic routes explicitly override it with their own computed value (see **CANON-1** for the latent risk this masks for future pages). **No conflicting canonical values found reaching production on any route tested.** Query strings are correctly stripped everywhere tested.

---

## 6. Open Graph Audit

See **OG-1** and **OG-2** above for the two real findings. Otherwise: `og:title`/`og:description` correctly present and accurate on every route tested, including all 13 static pages via layout inheritance. WordPress featured-image fallback to the sitewide default OG image works correctly on both case studies (see §13, reconfirms SEO-7/CMS-4). No route was found with a `openGraph: undefined` regression (the specific bug `metadata.ts:34-39`'s comment documents as previously fixed) — confirmed not regressed.

---

## 7. Twitter Cards Audit

`twitter:card: summary_large_image` renders consistently on every route tested, static and dynamic alike, correctly inheriting from the layout default where a page sets no override. Title/description mirror the OG values correctly (both ultimately source from the same resolved `title`/`description`). No independent Twitter-specific defects found beyond the OG-level issues already documented (a missing `og:url` doesn't have a Twitter-card equivalent field, so **OG-1** doesn't compound here).

---

## 8. JSON-LD Audit

**Builder inventory** (`src/lib/seo/json-ld.ts`, consumed via the single shared `src/components/common/JsonLd.tsx`):

| Schema | `@type` | Consumers | Status |
|---|---|---|---|
| Organization | `Organization` | sitewide (`layout.tsx`) | Clean — `@id`, self-hosted logo, `sameAs` from `SOCIAL_LINKS` |
| WebSite | `WebSite` | sitewide | Clean — `publisher` references Organization via `@id` |
| BlogPosting | `BlogPosting` | `/blog/[slug]` | Clean structure; see **DATE-1** for a timestamp-format nit |
| Case study | `CreativeWork` | `/case-studies/[slug]` | Clean structure; see **DATE-1** |
| BreadcrumbList | `BreadcrumbList` | `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/tag/[slug]`, `/case-studies`, `/case-studies/[slug]`, `/services/[slug]` | Clean — every item URL built via `getCanonicalUrl()`, absolute, correct domain |
| Service | — none — | `/services/[slug]` has BreadcrumbList only | Matches master audit §22 item 7 — real enhancement opportunity, not a defect |

`datePublished`/`dateModified` correctly and distinctly sourced from WordPress's `date`/`modified` fields respectively (no swap) in both `post.adapter.ts` and `case-study.adapter.ts`. `description` fields run through `cleanText()` (tag-stripping) before embedding, so raw WordPress HTML tags cannot reach a JSON-LD text field as literal markup (entity-decoding is a separate, distinct gap — see **CONTENT-1**).

**JSONLD-1** — `/services` listing has no `BreadcrumbList` JSON-LD, unlike every other listing page. **Category D, P3.** Likely fell out of scope while `/services` remains the hardcoded placeholder (Phase 1's ARCH-1). Claude can fix.

**JSONLD-2 / reconfirms master-audit SEO-2** — the homepage still leaks raw Yoast `seo.jsonLd` (including `cms.tffdigital.com` URLs — `SearchAction` targeting `cms.tffdigital.com/?s=`, `BreadcrumbList` items, `isPartOf`/`@id` references) into the React hydration payload via `SelectedWork.tsx`, which receives the full, unfiltered `CaseStudy` object as props and never reads `.seo` (confirmed by grep — zero usage). **This is distinct from the script-injection question below**: it never enters a `<script type="application/ld+json">` tag, so Google's structured-data parser never sees it — the actual rendered, crawlable JSON-LD on the homepage is clean (Organization + WebSite only). It's a plain page-source/hydration-payload leak of an internal hostname, not a crawlable SEO defect. **Category C, Priority P1** (unchanged from master audit — a status re-confirmation, not a re-prioritization). **A specific false-positive was investigated and ruled out this pass:** the blog post's 16 `cms.tffdigital.com` occurrences are a *different*, benign thing — the legitimate WordPress-media-hosted OG image URL, appearing once in a real `<meta>`/`<img>` tag (correct, deliberately CMS-hosted by design) and once more in ordinary RSC hydration data — not a second instance of the Yoast-graph leak. Owner: Claude can fix (narrow `SelectedWork`'s prop type).

**Security check — JSON-LD script-tag injection via `dangerouslySetInnerHTML` — classification: SAFE AS IMPLEMENTED**

Full reasoning, as required by this audit rather than a bare assertion:
1. `JsonLd.tsx:18` runs `JSON.stringify(data).replace(/</g, "<")` **after** `JSON.stringify` has already flattened the entire (possibly deeply nested) object into one string, with the global `/g` flag — every `<` anywhere in the output, at any nesting depth, is covered in one pass. There is no field-shape-dependent gap.
2. Escaping only `<` is sufficient and correct: the HTML parser's script-end-tag recognition triggers on the literal byte sequence `</script` appearing in the raw source, regardless of JS/JSON validity. With every `<` replaced by the 6-character string `<`, the raw HTML source can never contain a literal `<`, so `</script` can never appear inside the injected content.
3. Data integrity is preserved for legitimate consumers: `<` is a valid JSON Unicode escape — any JSON-LD parser (including Google's) correctly decodes it back to `<` when it runs its own `JSON.parse()` on the script's text content.
4. Coverage is total: a repo-wide grep confirms exactly **2** `dangerouslySetInnerHTML` usages in the entire project — this one, and `ArticleContent.tsx` (unrelated body-content rendering, Phase 1's ARCH-5, out of scope here). Every JSON-LD embed in the app routes through this one shared component — no second, parallel, unescaped implementation exists anywhere.

**Conclusion: safe as implemented, high confidence.** Not a theoretical concern requiring a caveat — the mitigation is structurally complete and independent of input shape or content.

---

## 9. Sitemap Audit

**Code:** `src/app/sitemap.ts` → `getAllSitemapEntries()` (`src/lib/seo/sitemap.ts`). 10 static routes + all published blog posts + all published, non-placeholder case studies, each dynamic source independently try/catch-wrapped so one WPGraphQL failure can't blank the whole sitemap. Domain sourced from `siteConfig.url`.

**Live fetch, 200 OK, 13 URLs total** — exact match to what the code should produce, zero drift.

| Check | Result |
|---|---|
| MISSING (tracked, not new) | 7 real WordPress Service entries — deliberately excluded, `TODO: RESTORE WORDPRESS DATA` comments present, tied to Phase 1's ARCH-1 |
| **MISSING — SITEMAP-1 (new)** | `/blog/category/[slug]` and `/blog/tag/[slug]` — live, indexable taxonomy routes (`/blog/category/seo` confirmed 200/INDEX) are never enumerated by `getAllSitemapEntries()`. Unlike the Service-entry omission, there is no comment or TODO explaining this one — appears to be a genuine oversight. **Category C, Priority P2.** Claude can fix (add a taxonomy-entries fetch, reusing whatever powers the category/tag pages' own data). |
| EXTRA | None |
| DUPLICATE | None |
| WRONG DOMAIN | None — 13/13 on `https://www.tffdigital.com`, zero leakage |
| WRONG LASTMOD | None structurally — correctly sourced from WordPress's `modified` field, not `date` — but see **DATE-1** for a format nit shared with JSON-LD |

---

## 10. Robots.txt Audit

**Code:** `src/app/robots.ts` → `{ rules: { userAgent: "*", allow: "/" }, sitemap: "<url>/sitemap.xml" }`. No `Disallow` rules (reconfirms master audit SEO-6, P3, unchanged).

**Live fetch, exact match to code:**
```
User-Agent: *
Allow: /

Sitemap: https://www.tffdigital.com/sitemap.xml
```
Correct HTTPS/www domain, no CMS references, nothing accidentally blocked (there are zero Disallow rules to misconfigure). **Category I, Working as Designed.** The separate CMS-domain robots.txt (`cms.tffdigital.com/robots.txt`) has zero code dependency from the frontend's generator — confirmed by reading the full generation logic — and is correctly out of scope here (already covered under master audit §5's CMS hardening).

---

## 11. Indexability Audit

| Combination checked | Found? | Verdict |
|---|---|---|
| NOINDEX + sitemap inclusion | **Yes** — both case studies + the blog post | **Contradiction — this is master-audit SEO-1, the P0, reconfirmed live unchanged today.** All 10 real WP content pages noindexed; 3 of them (2 case studies + blog post) still sitemap-listed with real `lastmod` values. Root cause remains a WordPress/Yoast Content-Types-default setting, not code — no code path in this repo sets that directive. |
| INDEX + missing canonical | **Not found** — every route tested, static or dynamic, had a correct canonical tag regardless of `og:url` status | Clean |
| NOFOLLOW + internal links | Present on noindexed pages (case studies, blog post, services), but this is the *expected*, consistent pairing — a noindexed page correctly also telling crawlers not to follow its links is coherent, not contradictory | **I. Working as Designed** |
| HTML robots meta vs. `X-Robots-Tag` header | Header absent everywhere (**IDX-1**, P3) — the meta tag is the sole signal | Not a contradiction (nothing conflicts), but a completeness gap — see IDX-1 below |

#### IDX-1 — `X-Robots-Tag` HTTP header absent on every route
- **Category:** H. Improvement — **Priority: P3**
- **What:** Zero routes tested (indexable or not) carry an `X-Robots-Tag` response header; the robots signal exists only in the rendered HTML `<meta>` tag.
- **Why it's low-severity:** Standard Next.js Metadata API behavior, not a framework bug. Google itself renders JavaScript and reads the HTML meta tag correctly. Real-world risk is limited to non-JS-executing tools/crawlers that only read HTTP headers.
- **Recommended action:** Optional — could add the header via middleware or route-level headers for defense-in-depth, particularly on the noindexed WordPress-backed routes.
- **Owner:** Claude can fix. **Effort:** Low-Medium (would need a middleware or per-route header addition). **Risk:** Low.

---

## 12. Blog SEO Audit

Title/description/canonical/OG/Twitter/JSON-LD `BlogPosting`/author/date construction traced end to end in `post.adapter.ts` → `post.service.ts` → `blog/[slug]/page.tsx`. Confirmed correct on all fields except the entity-decoding gap (**CONTENT-1**, below) and the `og:type` scope issue (**OG-2**). Pagination/search: `/blog`, `/blog/category/[slug]`, `/blog/tag/[slug]` all correctly self-canonicalize to their fixed listing URL regardless of any future `?q=`/`?after=` parameter — deliberately prevents duplicate-content indexing of search/pagination variants, at the cost of page-2+ content never independently ranking if volume grows. Moot today (exactly one real post exists). **Category H/INFO** — a tradeoff, not a bug.

#### CONTENT-1 — HTML entities not decoded after tag-stripping — LIVE, CONFIRMED
- **Category:** B. Confirmed Live Bug — **Priority: P2**
- **What:** `stripHtml()` (`src/lib/content/post-content.ts:3-5`) strips HTML tags via regex but never decodes HTML entities (`&hellip;`, `&#8217;`, `&amp;`, `&nbsp;`, etc.). Every "safe plain text" helper built on it inherits the gap: `htmlToPlainText`, `cleanText` (`json-ld.ts`), and the fallback path in `seo.adapter.ts:36`.
- **Evidence — live, today:** WordPress's `excerpt` field for the one real post returns rendered HTML carrying an entity (confirmed via live GraphQL: `"...e-commerce store, or [&hellip;]</p>"`). Live rendered `https://www.tffdigital.com/blog` shows the literal text `[&hellip;]` (not an ellipsis) inside the `PostCard` excerpt. Live JSON-LD on `/blog/seo-for-small-businesses` shows the same literal `[&hellip;]` string inside the `BlogPosting.description` field — independent of the page's own correct, clean Yoast `<meta description>`, which is unaffected because it sources from a different field.
- **Impact:** Live now, user-visible, will recur on every future post/case-study whose excerpt is WordPress-auto-generated or whose Yoast description is blank (already the norm across current content).
- **Recommended action:** Add HTML-entity decoding to `stripHtml` (or a wrapping step) covering WordPress's common entity set.
- **Owner:** Claude can fix. **Effort:** Low. **Risk:** None — purely additive text-quality fix.

#### CONTENT-3 — Yoast free-text fields (`metaDesc`, `opengraphDescription`, `twitterDescription`) not passed through `stripHtml`
- **Category:** D. Low Priority Bug (defensive gap, not demonstrated live) — **Priority: P3**
- **What:** `seo.adapter.ts:36-37` explicitly strips the `fallback.description` path (known to carry markup) but uses `wpSeo?.metaDesc`/`opengraphDescription`/`twitterDescription` raw. Every live sample checked this pass (case study, blog, service) rendered clean — these are plain-text Yoast admin fields in practice — so this is an asymmetry/defensive gap, not a demonstrated live bug.
- **Recommended action:** Apply the same stripping for consistency/defense-in-depth.
- **Owner:** Claude can fix. **Effort:** Trivial. **Risk:** None.

#### CONTENT-4 — `adaptSeo()` duplicates `htmlToPlainText`'s logic inline
- **Category:** H. Improvement — **Priority: P3**
- **What:** `seo.adapter.ts:36` reimplements `stripHtml(...).replace(/\s+/g, " ").trim()` instead of calling the already-imported-elsewhere `htmlToPlainText()` helper. Trivial duplication.
- **Owner:** Claude can fix. **Effort:** Trivial. **Risk:** None.

#### DATE-1 — JSON-LD dates and sitemap `lastmod` lack a timezone designator
- **Category:** D. Low Priority Bug — **Priority: P3**
- **What:** Live `datePublished`/`dateModified` (e.g. `"2026-09-01T14:16:28"`) and sitemap `<lastmod>` (e.g. `2026-09-01T16:50:39`) carry no `Z`/offset. WordPress's GraphQL date fields are site-local time (Bluehost India hosting), passed straight through by `json-ld.ts` and `sitemap.ts` with no reformatting.
- **Impact:** Technically non-conformant ISO 8601 (a bare timestamp without an offset is ambiguous); in practice most consumers (Google included) are tolerant, but it's incorrect strictly speaking.
- **Recommended action:** Append the correct offset for WordPress's configured site timezone — **not** a blind `Z` suffix, which would misrepresent the actual moment by the timezone difference. Requires knowing WordPress's configured timezone setting.
- **Owner:** Claude can fix the formatting once the correct source timezone is confirmed (partially owner-dependent — needs a WP-admin timezone check first). **Effort:** Low. **Risk:** Low.

#### DATE-2 — Both case studies' `datePublished` is the same calendar day as `dateModified`
- **Category:** J. Unknown/Needs Verification — **Priority: INFO**
- **What:** ChicaBebo: published `14:16:28`, modified `16:50:33` same day. RoyaltyMirror: published `14:11:40`, modified `16:50:37` same day. Cannot determine from live data alone whether this reflects genuinely recent WordPress entry creation or a republish that reset an originally-older publish date.
- **Owner:** WP admin, only if historical-freshness accuracy matters for these specific entries. Not asserting a defect.

---

## 13. Case Study SEO Audit

Title/description/canonical/OG/Twitter/JSON-LD/breadcrumb/date construction traced end to end for both real entries (ChicaBebo, RoyaltyMirror — confirmed still the real published entries by live on-page content, not assumed from the master audit's date).

- **Featured image:** both still `featuredImage: null` live via GraphQL (**reconfirms master audit CMS-4/SEO-7, unchanged**) — `og:image` correctly falls back to the sitewide default image per `seo.adapter.ts`/`metadata.ts`'s documented fallback chain. **Category F/I, P3, working as designed given the underlying content gap.**
- **Project URL field:** correctly handled in metadata construction, not leaked into unexpected fields.
- **Excerpt field (adapter-level):** `case-study.adapter.ts:34` — `excerpt: wpCaseStudy.excerpt ?? ""` is **not** stripped at the adapter level, unlike `post.adapter.ts:14`'s equivalent field. Both current consumers (the detail page's own body render, and the JSON-LD builder) independently re-strip at their point of use, so there is **no live leak today** — but a future direct consumer of the adapter's `excerpt` field would inherit raw WordPress HTML with no adapter-level safety net.

#### CONTENT-2 — Case-study adapter doesn't strip `excerpt`, unlike the post adapter
- **Category:** D. Low Priority Bug (latent, not live) — **Priority: P3**
- **Recommended action:** Strip in the adapter, matching `post.adapter.ts`'s pattern, for consistency and to close the latent gap.
- **Owner:** Claude can fix. **Effort:** Trivial. **Risk:** None.

CMS-native permalink duplicate surface (`cms.tffdigital.com/case-study/<slug>/`) **reconfirmed still live today** — HTTP 200 for both real case studies, alongside the correct frontend canonical (**reconfirms master audit CMS-8, unchanged, P3**).

---

## 14. Service SEO Audit

Fallback chain (`shortDescription` → strip → `adaptSeo` → `buildMetadata`) confirmed **live and correct** — all 7 real services have empty Yoast `metaDesc`/`opengraphDescription` (confirmed via live GraphQL), so the code-level fallback is what's actually rendering everywhere.

**Reconfirms master audit CMS-9, with a new live detail:** WordPress's own literal test copy is confirmed live in production today — `https://www.tffdigital.com/services/ai-consulting`'s meta description and `og:description` both render exactly `"THIS IS LIVE DESCRIPTION TEST"`. Per this audit's own instruction, this is explicitly **Category F — Content/Owner Input Required, not an SEO-implementation bug** — the code's fallback chain is doing exactly what it should with the data it's given. **New detail this pass:** since services are `noindex`, search visibility isn't affected, but **OG tags are not gated by noindex** — a shared link's social-preview card would show this test copy publicly regardless of indexability. **Priority P2** given the live public-visibility angle (elevated from the master audit's original framing, same root cause). **Owner: wp-admin editorial cleanup.**

`/services/seo` and `/services/smm` (bespoke static pages) confirmed to have complete, non-fallback, page-specific metadata — no accidental generic-default inheritance. **Category I, no finding.**

---

## 15. Content Sanitization Audit

Full-repo sweep for `dangerouslySetInnerHTML`, `JSON.stringify`, `stripHtml`, `decode`, `sanitize`, `excerpt`, and every `content`/`description`/`metaDesc` field. Findings consolidated: **CONTENT-1** (entity-decoding gap, live-confirmed, P2), **CONTENT-2** (case-study excerpt unstripped at adapter level, latent, P3), **CONTENT-3** (Yoast free-text fields unstripped, defensive gap, P3), **CONTENT-4** (duplicated stripping logic, P3).

Distinct from Phase 1's **ARCH-5** (body-content rendering via `dangerouslySetInnerHTML` with no sanitizer library, a deliberate documented trust-boundary choice — not re-derived here): this pass specifically checked whether WordPress HTML leaks into places that must **never** render HTML at all — meta tag attributes, JSON-LD text fields, plain-text excerpt cards. Confirmed: tags themselves are correctly stripped everywhere checked (none of the live samples showed a literal `<p>` or `<strong>` tag rendering as visible text) — the only leak found is the entity-decoding gap above, which is a text-fidelity issue, not an HTML-tag leak. All non-`dangerouslySetInnerHTML` JSX renders (e.g. `<p>{summary}</p>`) are React-escaped by default regardless of tag/entity content, so those paths are safe independent of the `stripHtml` gap.

---

## 16. Duplicate Content Audit

| Vector | Handling | Status |
|---|---|---|
| www vs. non-www, http vs. https | Correct redirect chains on all combinations tested (see §3 table); apex-http takes 2 hops (reconfirms INFRA-4, P3, unchanged) | Sound |
| Query parameters | Stripped from canonical everywhere tested; ISR correctly ignores them for caching | Sound |
| Search/category/tag pages | Self-canonicalize to their own fixed URL (see §12) | Sound, deliberate |
| WordPress-native permalinks vs. frontend permalinks | CMS-native URLs remain directly reachable (200), not redirected (reconfirms master audit CMS-8, P3, unchanged) — noindexed CMS-side, so not a search-visibility issue, but a real duplicate-surface if ever externally linked | Unchanged, tracked |
| Trailing slash | Normalized correctly (308 → no-slash form) | Sound |

No new duplicate-content vector found beyond what the master audit already tracked.

---

## 17. Production Verification

All live claims in this report were fetched directly from `https://www.tffdigital.com` (and WP REST/GraphQL at `cms.tffdigital.com` for content discovery only) on 2026-09-02, using `curl -s -i` for full headers + body — not a rendered/summarized fetch. Cache state (`x-vercel-cache`) was checked where relevant; a STALE/HIT response was still confirmed structurally consistent with what current source would produce (e.g., BreadcrumbList present only on nested routes, matching the code's own conditional logic — not a stale artifact). The git working tree was confirmed byte-for-byte unchanged (same HEAD, same pre-existing status) at the end of every sub-pass and again at the end of this orchestrating pass (see §2). No POST/PUT/DELETE request was made anywhere; no WordPress admin/auth endpoint was touched.

---

## 18. Regression Verification

| Prior fix (named in this audit's brief) | Verdict |
|---|---|
| Title double-suffix fix | **NOT REGRESSED** — empirically verified live/locally on homepage and all 3 dynamic content types |
| `og:url` construction | **NOT REGRESSED where invoked** — the construction logic itself (`metadata.ts:53`) is correct and matches canonical wherever it runs. **However, this regression check surfaced OG-1**: the logic was never wired up for the 13 static pages in the first place — best understood as an incomplete original scope, not something that broke, since Fork evidence shows no prior document ever claimed static-page `og:url` was working |
| HTML stripping in meta descriptions | **NOT REGRESSED for the path it covers** (fallback/excerpt description) — but confirmed **incomplete**, not comprehensive: never covered Yoast's own description fields (CONTENT-3) or entity decoding (CONTENT-1). Both read as original scope gaps, not regressions of something that used to work more broadly |
| `datePublished`/`dateModified` population | **NOT REGRESSED (populated correctly, correct field mapping)** — but both lack a timezone designator (DATE-1), a pre-existing format nit, not a new break |
| Sitemap `lastModified` correctness | **NOT REGRESSED** — correct source field (WordPress `modified`, not `date`), same timezone-format nit as above |
| Default/fallback SEO description | **NOT REGRESSED** — confirmed non-empty, used correctly as the last-resort fallback |
| Canonical behavior (www, https, no trailing slash) | **NOT REGRESSED** — confirmed on 9+ routes |
| www-domain consistency | **NOT REGRESSED** |
| OG-field inheritance behavior | **NOT REGRESSED, and more thoroughly verified than before** — the `seo: null` stripping-bug fix is sound; the 13-static-page title/description inheritance path was independently empirically verified this pass (url inheritance is the one field that never worked — see OG-1, not a regression of previously-working behavior) |

**No previously-fixed issue has regressed.** OG-1 is new-to-this-audit's-documentation, not a break of anything previously confirmed working.

---

## 19. Complete Findings Table

| ID | Priority | Category | Finding | Evidence | Location | Production Impact | Owner | Recommended Action |
|---|---|---|---|---|---|---|---|---|
| SEO-1 | P0 | A | 10 real WP pages noindexed live while 3 remain sitemap-listed (reconfirmed unchanged) | Live meta/GraphQL, both dates | WordPress/Yoast setting | Zero search visibility for all real editorial content | WP Admin | Yoast → Content Types default toggle |
| SEO-2 | P1 | C | Homepage leaks raw Yoast JSON-LD (`cms.tffdigital.com` URLs) into hydration payload (reconfirmed, mechanism re-verified, false-positive on blog post ruled out) | `SelectedWork.tsx` unused `seo` prop | `src/app/page.tsx:76`, `SelectedWork.tsx` | Internal hostname visible in page source; not crawled by structured-data parsers | Claude | Narrow `SelectedWork`'s prop type to exclude `seo` |
| OG-1 | P2 | C | `og:url` absent on all 13 static pages; root-caused to `buildMetadata()`'s `if (seo)` gate | Direct code read + live matrix, 13/16 routes | `metadata.ts:44-61`, every static `page.tsx` | Social-share previews missing canonical URL on every major marketing page | Claude | Add `openGraph.url` per static page, or restructure `buildMetadata()`'s gating |
| SITEMAP-1 | P2 | C | Blog category/tag archive pages missing from sitemap, no explaining comment (new) | `sitemap.ts` code + live diff | `src/lib/seo/sitemap.ts` | Minor discoverability gap for otherwise-working, indexable pages | Claude | Add taxonomy-entries fetch to `getAllSitemapEntries()` |
| CONTENT-1 | P2 | B | `stripHtml` doesn't decode HTML entities — live, visible as `[&hellip;]` in blog excerpt + JSON-LD | Live render + live GraphQL | `src/lib/content/post-content.ts:3-5` | Cosmetic, user-visible malformed text on the one live blog post today; will recur | Claude | Add entity decoding to `stripHtml` |
| CMS-9 | P2 | F | WordPress test copy ("THIS IS LIVE DESCRIPTION TEST") live in public OG tags (reconfirmed, new detail: not gated by noindex) | Live meta/og fetch, `/services/ai-consulting` | WordPress content | Public social-preview cards show test copy | WP Admin | Editorial cleanup of 7 service entries |
| OG-2 | P3 | D | `og:type` hardcoded "website" for all content types (scope widened from master audit's blog-only framing) | `seo.adapter.ts:53` + live on 3 routes | `src/adapters/seo.adapter.ts:53` | Minor OG-type inaccuracy, low real-world effect | Claude | Make `type` conditional per content type |
| CANON-1 | P3 | H | Canonical `??` doesn't treat empty-string WP canonical as absent (latent footgun, not live) | `seo.adapter.ts:48` | `src/adapters/seo.adapter.ts:48` | None today; risk for a future page | Claude | Change `??` to `||` |
| IDX-1 | P3 | H | `X-Robots-Tag` HTTP header absent on every route | Live headers, all routes | Next.js Metadata API default behavior | Low — Google renders JS and reads the meta tag | Claude | Optional: add header via middleware |
| META-1 | P3 | D | Duplicate `<meta name="robots">` on every 404 (Next.js auto-injection + custom tag) | Local render | `src/app/not-found.tsx:8-11` | None — both agree on `noindex` | Claude | Optional cosmetic fix or document as expected |
| CONTENT-2 | P3 | D | Case-study adapter doesn't strip `excerpt` (latent, not live) | `case-study.adapter.ts:34` | `src/adapters/case-study.adapter.ts:34` | None today (re-stripped downstream) | Claude | Strip at adapter level, matching `post.adapter.ts` |
| CONTENT-3 | P3 | D | Yoast free-text fields not stripped (defensive gap, no live HTML found) | `seo.adapter.ts:36-37,51,58` | `src/adapters/seo.adapter.ts` | None demonstrated | Claude | Apply same stripping for consistency |
| CONTENT-4 | P3 | H | `adaptSeo()` duplicates `htmlToPlainText` inline | `seo.adapter.ts:36` | `src/adapters/seo.adapter.ts:36` | None | Claude | Call the shared helper |
| DATE-1 | P3 | D | JSON-LD/sitemap dates lack timezone designator | Live JSON-LD + sitemap | `json-ld.ts`, `sitemap.ts` | Technically non-conformant ISO 8601; tolerant consumers unaffected | Claude (needs WP timezone confirmed first) | Append correct site-timezone offset |
| SEO-4 (superseded by OG-2) | P3 | D | See OG-2 | — | — | — | Claude | Merged into OG-2 |
| SEO-5 | P3 | D | Blog 404 title generic instead of "Page not found" (reconfirmed, unchanged) | Live 404 fetch | `src/app/blog/[slug]/not-found.tsx` (missing) | Cosmetic inconsistency | Claude | Add metadata export |
| SEO-6 | P3 | D | robots.txt has zero Disallow rules (reconfirmed, unchanged) | Live + code | `src/app/robots.ts` | Low risk | Claude | Optional `Disallow: /api/` |
| SEO-7/CMS-4 | P3 | F/I | Both case studies lack native featured image (reconfirmed, unchanged); OG fallback working correctly | Live GraphQL | WordPress content | No unique social-preview image | WP Admin | Add featured images |
| CMS-8 | P3 | I/F | CMS-native permalinks still directly reachable, not redirected (reconfirmed, unchanged) | Live 200 on CMS domain | WordPress plugin | Duplicate surface if externally linked; noindexed | Claude (plugin filter) or defer | Optional 301 from CMS single-post URLs |
| INFRA-4 | P3 | D | Apex `http://` takes 2 redirect hops (reconfirmed, unchanged) | Live redirect chain | Vercel domain config | Cosmetic | Vercel config | Optionally collapse to 1 hop |
| JSONLD-1 | P3 | D | `/services` listing has no BreadcrumbList JSON-LD | Grep, zero matches | `src/app/services/page.tsx` | Cosmetic structured-data inconsistency | Claude | Add BreadcrumbList, matching other listings |
| DATE-2 | INFO | J | Both case studies' datePublished same day as dateModified | Live GraphQL | WordPress content | Unknown if intentional | WP Admin (if it matters) | None required |
| — | INFO | E (security check) | JSON-LD script-injection escaping | Full reasoning in §8 | `JsonLd.tsx:18` | None — safe as implemented | — | None required |

**P0: 1 (reconfirmed) · P1: 1 (reconfirmed) · P2: 5 (3 new: OG-1, SITEMAP-1, CONTENT-1; 2 reconfirmed with elevated/new detail: CMS-9, and SEO-2 status confirm) · P3: 15 · INFO: 2**

---

## 20. Claude-Fixable Tasks

Code-only, no WordPress/Vercel/DNS/credential dependency: **OG-1** (og:url on static pages), **SITEMAP-1** (taxonomy pages in sitemap), **CONTENT-1** (entity decoding), **OG-2** (og:type per content type), **CANON-1** (`??`→`||`), **IDX-1** (X-Robots-Tag header, optional), **META-1** (404 duplicate meta, optional/cosmetic), **CONTENT-2/3/4** (adapter stripping consistency + dedup), **DATE-1** (timezone formatting, once WP's timezone is confirmed), **SEO-5** (blog 404 title), **SEO-6** (robots.txt Disallow, optional), **JSONLD-1** (services BreadcrumbList), **SEO-2** (SelectedWork prop leak — carried from master audit, still open).

---

## 21. WordPress/User-Input Tasks

**wp-admin:** **SEO-1** (P0 — Yoast Content-Types indexability default), **CMS-9** (7 service entries' test/placeholder copy — now confirmed live in public OG tags too), **SEO-7/CMS-4** (featured images for both case studies), **DATE-2** (confirm whether same-day publish/modify is intentional, only if it matters).

**Vercel dashboard:** **INFRA-4** (optional single-hop apex redirect) — everything else in this phase is code- or WordPress-side.

**No new credential/DNS/business-decision items surfaced this phase** beyond what the master audit already tracked.

---

## 22. Improvements

**CANON-1**, **IDX-1**, **META-1** (or leave as documented Next.js behavior), **CONTENT-2/3/4**, **JSONLD-1**, **DATE-1** — all low-risk, low-urgency code-quality/robustness items with no current live impact beyond what's already noted per-item above.

---

## 23. Known/Accepted Limitations

- Full exploitation-style security testing remains out of scope for this SEO-focused phase — the JSON-LD injection question was answered rigorously because the audit brief specifically asked for it, not as a substitute for a dedicated security pass.
- **DATE-1**'s fix needs WordPress's configured site timezone confirmed before implementing — guessing it risks introducing a wrong-by-N-hours error, which would be worse than the current unlabeled-but-locally-correct timestamp.
- **DATE-2** cannot be resolved from live data alone; needs WP-admin edit-history context this audit has no access to.
- Production verification, while extensive, is still a point-in-time snapshot (2026-09-02); ISR caching means a very recently-changed WordPress field could take up to the configured revalidate window to appear live.

---

## 24. Things That Are Already Correct

Title double-suffix prevention (homepage and all WP-backed routes) — empirically verified, not assumed. `og:url` construction logic itself, everywhere it's actually invoked. Default/fallback SEO description, never empty. Canonical www/https/no-trailing-slash construction across every route tested. www-domain consistency throughout. OG/Twitter title+description inheritance from the layout on all 13 static pages. The previously-fixed `seo: null` OG/Twitter-stripping bug — confirmed sound. JSON-LD script-injection escaping — safe as implemented, rigorously verified. robots.txt — exact match between code and live production, zero issues. HTML-entity escaping of apostrophes/ampersands specifically inside rendered title/description attribute values (distinct from the stripHtml gap) — correct everywhere sampled. `/services/seo` and `/services/smm` — complete, non-fallback, page-specific metadata. Search/pagination canonicalization — safe and deliberate. Sitemap `lastModified` sourcing (correct field, just needs timezone formatting). JSON-LD date-field mapping (`datePublished`/`dateModified` correctly distinct, never swapped).

---

## 25. Recommended Priority Order

1. **SEO-1** (P0, wp-admin) — unchanged top priority from the master audit; nothing in this phase changes that.
2. **OG-1, SITEMAP-1, CONTENT-1** (P2, all Claude-fixable, all independent of each other and of SEO-1) — batch as one small PR; none touch indexability or risk anything live-breaking.
3. **CMS-9's newly-elevated detail** (P2, wp-admin) — worth folding into the same editorial pass the master audit already recommended for service content, now with the added urgency that it's live in public share previews today.
4. **SEO-2** (P1, Claude-fixable, carried from master audit, still open) — small, isolated, no reason to keep deferring.
5. **Everything else in P3** — batch opportunistically; none are urgent, none are interdependent in a way that requires sequencing.

---

## 26. Final PASS/FAIL Assessment

**PASS, with the same one pre-existing P0 as before and a handful of newly-documented P2/P3 code-quality gaps — none of which represent a regression.** SEO architecture is fundamentally sound: canonical construction, www/https normalization, JSON-LD structure and safety, sitemap/robots generation, and the metadata-inheritance model are all correctly built where they're actually wired up. The gaps found are real but narrow (a metadata-construction path that was never extended to static pages, an entity-decoding step that was never added, a sitemap enumeration that never covered one route type) — the kind of thing a deep second pass is supposed to surface, not evidence of a fragile system.

---

### A. CONFIRMED REMAINING PHASE 2 BUGS

1. **SEO-1** (P0, WordPress) — 10 real content pages noindexed live, 3 still sitemap-listed. *Not code.*
2. **SEO-2** (P1, Claude-fixable) — homepage JSON-LD hydration payload leaks `cms.tffdigital.com` URLs via an unused prop.
3. **OG-1** (P2, Claude-fixable) — `og:url` missing on all 13 static pages.
4. **SITEMAP-1** (P2, Claude-fixable) — blog category/tag pages missing from sitemap.
5. **CONTENT-1** (P2, Claude-fixable) — HTML entities not decoded; live malformed text on the current blog post.
6. **OG-2** (P3, Claude-fixable) — `og:type` wrong for all WP content types, not just blog.
7. **CANON-1** (P3, Claude-fixable, latent) — canonical `??` operator footgun for future pages.
8. **META-1** (P3, Claude-fixable, cosmetic) — duplicate robots meta tag on 404s.
9. **CONTENT-2** (P3, Claude-fixable, latent) — case-study excerpt unstripped at adapter level.
10. **CONTENT-3** (P3, Claude-fixable, defensive gap) — Yoast free-text fields unstripped.
11. **DATE-1** (P3, Claude-fixable pending WP timezone confirmation) — JSON-LD/sitemap dates lack timezone offset.
12. **SEO-5** (P3, Claude-fixable, reconfirmed) — blog 404 title inconsistency.
13. **SEO-6** (P3, Claude-fixable, reconfirmed) — robots.txt has no Disallow rules.
14. **JSONLD-1** (P3, Claude-fixable) — `/services` listing missing BreadcrumbList JSON-LD.
15. **IDX-1** (P3, Claude-fixable, optional) — `X-Robots-Tag` header absent everywhere.

### B. PHASE 2 IMPROVEMENTS (optional/polish, not bugs)

- **CONTENT-4** — deduplicate `htmlToPlainText` logic in `adaptSeo()`.
- **INFRA-4** (reconfirmed) — collapse apex `http://` to a single redirect hop.
- **CMS-8** (reconfirmed) — optional 301 from CMS-native permalinks to frontend URLs.
- Consider a `Service`-type JSON-LD schema for service detail pages (master audit §22, still just an opportunity).

### C. PHASE 2 CLEAN — ALREADY WORKING

Title double-suffix prevention · `og:url` construction logic (where invoked) · default SEO description fallback · canonical www/https/no-trailing-slash construction · www-domain consistency · OG/Twitter title+description layout inheritance · the previously-fixed `seo: null` stripping bug · JSON-LD script-injection escaping (rigorously verified safe) · robots.txt (exact code-to-production match) · apostrophe/ampersand entity-escaping in metadata attributes · `/services/seo` and `/services/smm` static metadata · search/pagination canonicalization strategy · sitemap `lastModified` field-sourcing · JSON-LD date-field mapping (no publish/modified swap) · JSON-LD Organization/WebSite/BlogPosting/CreativeWork/BreadcrumbList structural correctness · CMS-side robots.txt correctly out of frontend scope.

---

**PHASE 2 DEEP RE-AUDIT COMPLETE.**
**NO CODE OR CONFIGURATION WAS MODIFIED.**
**NO COMMIT OR PUSH WAS PERFORMED.**
**READY FOR PHASE 3.**
