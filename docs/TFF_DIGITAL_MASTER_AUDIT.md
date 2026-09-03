# TFF Digital — Master Project Audit

**Audit Date:** 2026-09-01 (live verification performed this date; document consolidated 2026-09-02)
**Audit Scope:** Full-stack, read-only — Next.js frontend (`src/`), the headless WordPress CMS (`cms.tffdigital.com`), the custom `tff-headless-leads` plugin, and live production (`www.tffdigital.com`)
**Repository/Production State:** `tff-digital @ main`, commit `0ff429c` — matches live production behavior everywhere checked
**Audit Status:** COMPLETE. This file supersedes all prior audit documents in `docs/` (see §13 and the cleanup log for what was consolidated) and is the permanent source of truth for the project's current state going forward.

> **Methodology.** Every claim below is tagged `[VERIFIED]`, `[PARTIALLY VERIFIED]`, `[UNKNOWN]`, or `[NOT IMPLEMENTED]`. Verified claims were confirmed live (HTTP/GraphQL/REST requests against both domains, a live browser pass, or local `tsc`/ESLint/`next build`/`npm audit` runs) or by direct source read — not assumed from memory or prior reports. Where two independent research passes disagreed, the live system was re-checked to resolve it; any disagreement that couldn't be resolved is marked `CONFLICTING EVIDENCE` explicitly rather than silently picking a side. Nothing was fixed, committed, deployed, or changed in WordPress while producing this document.

---

## 1. Executive Summary

TFF Digital is a Next.js 15 marketing site backed by a headless WordPress CMS. The engineering is in good shape: TypeScript strict mode, ESLint, and the production build all pass with zero errors; no hardcoded secrets exist anywhere; the preview-auth gate is genuinely timing-safe; CSP and security headers are live and well-reasoned; and the CMS-outage resilience pattern (8-second timeouts, ISR stale-serve, a deliberate strict/soft fallback split) is consistently applied. Several rounds of prior audit work already found and fixed real bugs (self-hosted brand assets, a broken Gravatar avatar, missing ARIA associations, a homepage title bug, fabricated placeholder content since replaced with real founder/testimonial data) — that work held up under fresh re-verification and is not revisited as open findings here.

**The one production blocker (P0):** every piece of real, human-authored WordPress content on the live site — both Case Studies, all 7 Services, and the one Blog post — currently serves `noindex, nofollow`, while `sitemap.xml` simultaneously lists three of those same URLs as indexable. This is a WordPress/Yoast editorial setting, not a code defect. See §17.

**The biggest status correction this audit made:** the headless View/Preview plugin (`tff-headless-leads`, v1.4.0) is confirmed **live in production** — prior tracking recorded it as still needing a manual wp-admin upload. Four independent live checks (WordPress's own REST `link` field for a Case Study, a Service, and the Blog post) prove otherwise. Nothing is pending there.

**What's still genuinely unresolved and load-bearing for the business:**
- The contact-form lead pipeline has never been verified end-to-end in production — see §7 for the exact, non-assumed status of the previously-reported "lead created but no email" symptom.
- Services are half-migrated: the detail route already renders live (if editorially messy) WordPress data, but the `/services` listing and homepage grid still show hardcoded placeholder copy.
- Zero web analytics is instrumented anywhere on the site.
- The homepage leaks raw WordPress/Yoast JSON-LD (including `cms.tffdigital.com` URLs) into its React hydration payload.

**Scorecard:** 1 P0 · 7 P1 · 13 P2 · 20 P3 · 1 INFO · 17 items confirmed working-as-designed · 6 items explicitly deferred to a future pass.

---

## 2. Current Architecture

**Stack** `[VERIFIED]`: Next.js 15.5.22 (App Router, Turbopack for both `dev` and `build`), React 19.1.0, TypeScript 5.9 (`strict: true`), Tailwind 4, Zod 4.4, react-hook-form 7.84, Resend 6.18, framer-motion 12.43. A consistent `adapter → repository → service` pipeline sits between WPGraphQL and the App Router, with typed GraphQL fragments/queries under `src/graphql` and Zod schemas at every external boundary.

**WordPress / WPGraphQL** `[VERIFIED]`: Bluehost-hosted (shared, India), WordPress 7.1 + WPGraphQL + Yoast SEO v28.4 + CPT-UI, behind the custom `tff-headless-leads` plugin (v1.4.0, confirmed live — see §5). GraphQL introspection is disabled for public requests (good default).

**Custom plugin** `[VERIFIED]`: `wordpress-plugin/tff-headless-leads/tff-headless-leads.php` (607 lines, read in full) does three jobs: (1) the public `POST /wp-json/headless/v1/leads` endpoint, (2) headless hardening that keeps `cms.tffdigital.com` out of search engines, (3) View + Preview URL rewriting for Case Studies, Services, and Blog Posts (View only for the latter).

**Vercel** `[VERIFIED via repo + DNS]`: frontend hosting. No `vercel.json` — no region pinning, default `iad1` (US East) runtime, a ~1.3s latency floor to the Mumbai-hosted CMS on every WordPress-touching request. DNS confirms `www`/apex resolve to Vercel edge IPs; nameservers remain `ns1/ns2.bluehost.in`; `cms.tffdigital.com` → `119.18.49.42` (Bluehost); apex MX → Microsoft 365.

**Route inventory** `[VERIFIED]`:

| Route | Render | Data source |
|---|---|---|
| `/` | SSG, 60s ISR | Static hero + WP-sourced Selected Work (featured case studies) |
| `/about` | Static | Static |
| `/services` | Static | Hardcoded (`temporary-services.ts`) — see ARCH-1 |
| `/services/[slug]` | Dynamic, no ISR | Live WordPress — no `generateStaticParams`, unlike Case Study/Blog |
| `/services/seo`, `/services/smm` | Static | Bespoke pages, confirmed no colliding WP slug |
| `/case-studies` | Dynamic (strict) | WordPress — 5xx on CMS outage, deliberate |
| `/case-studies/[slug]` | SSG, 60s ISR | WordPress, `generateStaticParams` over real entries |
| `/blog`, `/blog/category/[slug]`, `/blog/tag/[slug]` | Dynamic | WordPress |
| `/blog/[slug]` | SSG, 60s ISR | WordPress, `generateStaticParams` |
| `/contact`, `/privacy-policy`, `/terms-and-conditions` | Static | Static |
| `/api/preview/case-study`, `/service`, `/disable` | Route handler | Draft Mode entry points, WordPress-authenticated |
| `/robots.txt`, `/sitemap.xml`, `/manifest.webmanifest` | Generated | Mixed |

No `middleware.ts` anywhere — Draft Mode runs entirely through route handlers and `next/headers`, the correct Next 15 pattern, not a gap. No `loading.tsx` anywhere. Case-study/service detail routes have no dedicated `not-found.tsx`; live-tested and confirmed it correctly falls through to the root boundary (§21). No `vercel.json`, no `.github/workflows` — both confirmed absent directly.

**Layered data architecture** `[VERIFIED]`:

*Active — wired end-to-end into a route:* Case Study (repository, service, adapter, GraphQL, View, Preview), Service Offering (same full stack; page live, listing still hardcoded), Post/Blog (full stack, View only, no Preview), Navigation/Taxonomy helpers used by blog category/tag pages.

*Dormant — built, zero references from `src/app`, `src/sections`, or `src/components`:*
- **ARCH-2** (P2): A complete "Portfolio" integration layer (repository, service, adapter, GraphQL query, domain/API types) has zero consumers. Not dead scaffolding — WordPress has a real, separate `projects` CPT with **6 published entries** (AI Automation Dashboard, Real Estate Landing Page, Salon Booking, TFF Digital, YS Creations, Athlix Nutrition) sitting behind it, unreachable from the frontend. `grep -rl "portfolio" src/app src/sections src/components` → no output; `GET cms.tffdigital.com/wp-json/wp/v2/types` confirms the CPT and its 6 entries.
- The same pattern exists for WordPress Pages (`content-page.repository/service/adapter.ts`) — zero route usage, correctly left unwired since no static page currently needs WordPress-managed copy.
- **ARCH-4** (P3): `navigation.repository.ts` / `navigation.service.ts` (`getNavigationMenu`) is also fully built and fully dormant. `Navbar.tsx` and `Footer.tsx` both hardcode their own `navLinks`/`footerLinks` arrays and contain zero references to the navigation service. `[VERIFIED]` fresh via `grep -rln "navigation.repository\|navigation.service\|getNavigationMenu" src/app src/sections src/components` → no output. `MIGRATION_REPORT.md` (kept, see §13) documents that the live `menus` GraphQL root field exists but the specific `MenuLocationEnum` value this repository expects (`PRIMARY`) was rejected by the schema at the time it was investigated — unconfirmed whether that's still the blocker today. Low priority: the header/footer are 7 links and a 3-column footer, small enough that hardcoding carries little cost.

**Env vars, config, resilience** `[VERIFIED]`:
- Every `process.env.*` reference in `src/` matches a line in `.env.example` exactly — no drift either direction, no undocumented vars. Only 2 `NEXT_PUBLIC_*` variables exist (`SITE_URL`, `SITE_NAME`), both non-sensitive. No hardcoded secrets found anywhere in `src/` or the WordPress plugin by full pattern sweep. `.gitignore` correctly excludes every `.env*` file except `.env.example` — confirmed directly, nothing sensitive is git-tracked.
- `next.config.ts` ships a real, commented CSP plus `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` — all confirmed live via response headers; HSTS is also live, added by Vercel's platform layer. `images.remotePatterns` is a tight, explicit allowlist (WordPress media host, Gravatar, WordPress.com mshots, the mock-data placeholder host) — no wildcard hosts, 31-day cache TTL tuned around the WordPress media host's slow, uncached responses.
- Every WordPress fetch (GraphQL and REST) carries an 8-second `AbortSignal.timeout`, with a typed `WordPressError` distinguishing config/network/HTTP/parse/GraphQL failure kinds. A deliberate **strict/soft split** runs through every listing function: primary content (e.g. the case-study listing) fails loud into the route's error boundary on a CMS outage; secondary surfaces (homepage sections, sitemap, `generateStaticParams`) fail soft into an empty result so an outage never takes down pages that don't strictly need live data.
- **ARCH-3** (P2): `WORDPRESS_USE_MOCK_DATA === "true"` forces mock content even when a real GraphQL endpoint is also configured — the explicit flag always wins over a present endpoint. Harmless in local dev, but if that exact string were ever pasted into Vercel's **Production** environment by mistake, the live site would silently start serving mock content with no error.

---

## 3. Content-Type Audit

| Content Type | WP Content | Next Route | View | Preview | Indexed | Current State | Required Action |
|---|---|---|---|---|---|---|---|
| **Case Study** | 2 real, published | `/case-studies/[slug]` | Frontend | Works | No — noindex live | Complete, working | Fix SEO-1 (indexability) |
| **Service** | 7 real (messy/test-suffixed titles) | `/services/[slug]` (detail only) | Frontend | Works | No — noindex live | Detail live & unlinked; listing hardcoded | Clean up WP copy, then flip ARCH-1 |
| **Blog Post** | 1 real, published | `/blog/[slug]` | Frontend | Not built (deliberate) | No — noindex live | View complete; Preview deferred | Fix SEO-1; build preview if prioritized |
| **Projects** | 6 real, published | None | CMS domain | CMS domain | — | Dead architecture, real content behind it | Decide: build `/projects`, or remove the layer (ARCH-2) |
| **Testimonials** | 1 stub ("John Smith") | None (local data) | — | — | — | 6 real, verbatim testimonials live from `testimonials.ts` | None — working as designed |
| **Team** | 1 stub ("Yash") | None (local data) | — | — | — | 6 real members live from `team.ts`, verbatim-transcribed bios | None — working as designed |
| **FAQ** | 1 stub | None (hardcoded) | — | — | — | Real Q&As hardcoded in `FAQ.tsx` | None — working as designed |
| **Pages** | 6 (leftover pre-headless) | None (dormant layer) | CMS domain | CMS domain | — | No live route needs one | None — working as designed |
| **Media** | WP uploads library | N/A, hotlinked | — | — | — | Served directly from `cms.tffdigital.com/wp-content/uploads` | None |
| **Leads** (`tff_lead`) | Write-only CPT | N/A, REST POST only | — | — | Private, correct | `public => false`, no REST/GraphQL read exposure | None |

Testimonials, Team, and FAQ are correctly **not** migration candidates — no frontend code touches their WordPress equivalents by design, confirmed both by the plugin's own routing comment and by direct grep. "Not headless" here means "not required," not "incomplete."

---

## 4. View + Preview Audit

Traced through both the Next.js code and the WordPress plugin, then live-tested against production. **Plugin v1.4.0 confirmed live** — see the REST `link`-field evidence below, re-derived independently four times across this audit rather than trusted from any prior note.

| Content Type | View | Preview | Status |
|---|---|---|---|
| Case Study | **PASS** — resolves to `www.tffdigital.com/case-studies/[slug]` | **PASS** — full `asPreview` + Draft Mode flow, live-tested | Complete |
| Service | **PASS** — resolves to `www.tffdigital.com/services/[slug]` | **PASS** — identical mechanism to Case Study, live-tested | Complete |
| Blog Post | **PASS** — resolves to `www.tffdigital.com/blog/[slug]` | **NOT IMPLEMENTED** — deliberate, documented gap; no `post.service.ts` preview-fetch fn, no `/api/preview/post` route (confirmed by listing `src/app/api/preview/*`) | View complete; Preview deferred |
| Projects | **NOT REQUIRED** — no frontend route exists at all (see §3) | **NOT REQUIRED** | Dead architecture, not a Preview gap |
| Testimonials / Team / FAQ | **NOT REQUIRED** — intentionally local static data, no WP-driven detail page exists for any of them | **NOT REQUIRED** | Working as designed |
| Pages | **NOT REQUIRED** — no live route consumes WordPress Pages | **NOT REQUIRED** | Working as designed |

**How it works** `[VERIFIED]`: WordPress core calls two different filters depending on post type; the plugin registers the same callback on both: `post_type_link` (Case Study, Service — true CPTs) and `post_link` (Blog Post — WordPress's built-in type). Both are gated on `post_status === 'publish'`, so an unpublished post's permalink is left untouched. `preview_post_link` is separately overridden — only for Case Study and Service — to redirect WordPress's own "Preview" button to `/api/preview/<type>?secret=…&id=…` instead of a CMS-domain URL.

That route: validates `secret` against `WORDPRESS_PREVIEW_SECRET` using `crypto.timingSafeEqual` with a length-check short-circuit (genuinely constant-time; a generic 401 either way, so the response can't fingerprint whether the secret is wrong or simply unconfigured) → fetches the draft via an authenticated WPGraphQL `asPreview` + `idType: DATABASE_ID` query using a server-only WordPress Application Password → enables Next.js Draft Mode (httpOnly cookie) → redirects to the real detail URL built from the already-fetched, WordPress-sourced slug (not reflected from the request — no open-redirect surface). Both detail pages branch on `draftMode().isEnabled` in `generateMetadata` and the page body, and **force `robots: {index:false, follow:false}` on any draft render** regardless of the eventual published SEO data.

**Live tests performed:**

| Test | Result |
|---|---|
| Missing `secret`, case-study & service preview routes | 401, generic message |
| Wrong `secret`, both routes | 401, identical response — no fingerprinting |
| `/api/preview/post` (blog) | 404 — route genuinely doesn't exist |
| `/api/preview/disable` | 307 → home, cookie cleared |
| Real case-study URL + `?preview=true`, no Draft Mode cookie | Ordinary published page — the query param is cosmetic only |
| REST `link` field, Case Study 176/177 | `https://www.tffdigital.com/case-studies/<slug>` |
| REST `link` field, Service (all 7) | `https://www.tffdigital.com/services/<slug>` |
| REST `link` field, Post 140 | `https://www.tffdigital.com/blog/seo-for-small-businesses` |

`[PARTIALLY VERIFIED]` The full authenticated round-trip (Application Password → live draft fetch) could not be independently re-exercised this session — `.env.local`'s preview secret/username/app-password keys all exist but are empty locally. The user hand-verified Case Study preview working end-to-end in a prior session; Service preview shares the identical, now-confirmed-live mechanism at high confidence but wasn't independently re-proven here.

---

## 5. WordPress / CMS Audit

**Public exposure, checked live** `[VERIFIED]`:
- `X-Robots-Tag` present on every CMS surface checked (homepage, post pages, `/wp-json/`, `/graphql`) — the CMS-wide noindex plugin is active. Matching `<meta name="robots">` in rendered CMS HTML. **CMS-1** (P3): the directive value is inconsistent across endpoints (`noindex, nofollow` on pages vs. `noindex` only on `/wp-json/`/`/graphql` vs. `noindex, follow` on the sitemap) — net effect unaffected, cosmetic.
- `robots.txt` is deliberately left permissive on the CMS too — the plugin's own comment explains why (a blocked crawler can never see a per-page noindex, so `Disallow` would strand already-indexed URLs).
- GraphQL introspection is disabled for public requests. `/wp-json/wp/v2/plugins` correctly requires auth (401) — no plugin enumeration possible via REST. REST namespace enumeration confirms only `oembed/1.0, headless/v1, yoast/v1, cptui/v1, wp/v2, wp-site-health/v1, wp-block-editor/v1, wp-abilities/v1` — no newsletter/Mailchimp/MailPoet namespace exists.

**CMS-2** (P1): **The Yoast XML sitemap still serves live** — `sitemap_index.xml` returns 200 with 10 sub-sitemaps (post, page, service, testimonial, team, faq, projects, case-study, category, author) — despite the plugin explicitly filtering `wpseo_enable_xml_sitemap` to `false`. That filter alone doesn't fully gate Yoast 28.4's sitemap router. Harmless for indexing (everything listed is already noindexed), but `robots.txt` still advertises it. **Fix:** wp-admin → Yoast SEO → Settings → Site features → XML sitemaps → Off (≈30 seconds).

**CPTs / test content** — see §13 for full detail; summary: 7 WordPress Service entries carry visible test/placeholder copy, 6 Projects entries are real, single stub entries exist for Testimonial/Team/FAQ (all superseded by real static frontend data).

**Additional surface, checked live:**
- **CMS-3** (P2): XML-RPC live with real attack methods exposed — `/xmlrpc.php` GET → 405 (expected), but POST `system.listMethods` → 200 with the full method list including `pingback.ping` (DDoS-amplification/port-scan vector) and `system.multicall` (fast wp-admin credential brute-forcing). A standard, pre-existing WordPress default, not introduced by this plugin.
- **CMS-4** (P2): `/wp-json/wp/v2/users` publicly enumerates the username "admin" — standard WordPress default (public fields only), a well-known low-effort recon target.
- **CMS-5** (P3): Both real case studies (ChicaBebo, RoyaltyMirror) have no native featured image set (`featuredImage: null`, confirmed via GraphQL); detail pages show no unique OG image as a result (see SEO-7).
- **CMS-6** (P3): RoyaltyMirror's `solution` field HTML contains a leaked rich-text-editor artifact (`<p class="PDq2pG_selectionAnchorContainer" data-start="…" data-end="…">`) — renders harmlessly, messy source markup.
- **CMS-7** (P3): Yoast emits **no canonical tag at all** on any CMS content type checked — `seo.canonical: ""` sitewide via GraphQL. Harmless today since `buildMetadata()` always supplies its own canonical first.
- **CMS-8** (P3): CMS-native URLs (e.g. `cms.tffdigital.com/case-study/<slug>/`) remain directly reachable — a plain 200 in WordPress's own theme, not redirected — alongside the new frontend View links. The plugin's filters change what URL WordPress *generates*; they don't close off the raw CMS URL with a server-side redirect. Noindexed, so not a search-visibility issue, but a duplicate-surface one if the old URL is ever linked.
- **INFO**: WordPress version (7.1) and Yoast version (28.4) both disclosed via generator meta/HTML comment; `readme.html` is reachable. Standard WordPress/Yoast defaults, low-severity fingerprinting.

**Leads endpoint** `[VERIFIED]`: `/wp-json/headless/v1/leads` correctly 404s on a bare GET (method not registered) and discloses only its field-name schema via OPTIONS — standard REST self-documentation, not a data leak. No POST was sent during this audit (see §7).

---

## 6. SEO Audit

**What's working** `[VERIFIED]`:
- Every canonical tag, OG url, JSON-LD id, and sitemap entry resolves to `https://www.tffdigital.com` — zero apex or Vercel-preview-domain leakage across every route tested. `http://tffdigital.com` → apex-https → www-https; `http://www.tffdigital.com` → single hop to https-www.
- Trailing slash (`/about/`) 308s to the canonical no-slash form. Query strings never leak into the canonical tag; ISR cache correctly ignores them.
- 404s are clean on unknown and known-deleted slugs across all three content types: correct status, `noindex`, no stray JSON-LD, on-brand design.
- `/blog/category/seo` (a real taxonomy term) renders correctly with its own title/description/breadcrumb; a fabricated category and tag both correctly 404.
- `?preview=true` on a real page with no Draft Mode cookie renders the ordinary published page — no draft-content leak.

**SEO-1 — P0 — see §17 for full detail.** All 10 pieces of real WordPress content are noindexed live while the sitemap lists 3 of them as indexable.

**SEO-2** (P1): **The homepage leaks raw Yoast JSON-LD — including `cms.tffdigital.com` URLs — into its hydration payload.** The one real `<script type="application/ld+json">` tag (Organization + WebSite only) is clean and correctly scoped — Google's structured-data parser never sees the leaked data. But the page's rendered source contains `cms.tffdigital.com` a dozen times elsewhere: Yoast's raw graph for both case studies (a `SearchAction` targeting `cms.tffdigital.com/?s=`, `ReadAction`, `BreadcrumbList` items) serialized into the React hydration payload. Traced to `SelectedWork.tsx`, a Client Component that receives the *full* `CaseStudy` object — including the unused `seo.jsonLd` field — as props. Not a crawlable SEO defect, but it leaks an internal CMS URL into page source and adds dead weight to the payload. **Fix:** stop passing `seo`/`seo.jsonLd` into that component's props.

**Minor / polish:**
- **SEO-3** (P3): The blog post's `og:image` is a separate, manually-set Yoast field — not the post's native WordPress featured image, which is unset (`featured_media: 0`, confirmed via both GraphQL and REST). That Yoast-set image is a raw upload at **2,126,793 bytes (~2.03MB)**, unoptimized PNG, referenced by its raw URL so it never passes through `next/image`'s optimizer.
- **SEO-4** (P3): Blog post `og:type` is `"website"`, not the more correct `"article"` for a `BlogPosting`.
- **SEO-5** (P3): `/blog/[slug]`'s 404 falls back to the generic layout title instead of "Page not found | TFF Digital" like the case-study/service/root 404s — likely a missing metadata export on `blog/[slug]/not-found.tsx`.
- **SEO-6** (P3): `robots.txt` has no `Disallow` rules at all — low risk, but `/api/*` is technically crawlable.
- **SEO-7** (P3): Case-study detail pages have no unique `og:image` — they inherit the sitewide default rather than using the client-site screenshot already generated for the homepage cards.
- Two low-priority, not-currently-broken opportunities carried over from a prior audit pass, still accurate: no `FAQPage`/`Service`-type JSON-LD exists anywhere (a real enhancement opportunity, not a defect — see §22); and `adaptSeo()`'s reliance on every dynamic route explicitly overriding WordPress's own (wrong-path) Yoast canonical is a fragile-but-currently-correct pattern worth a code comment for future maintainers.

---

## 7. Forms / Lead Pipeline Audit

Full code trace: `ContactForm.tsx` → Server Action → WordPress REST → storage → Resend email. **No live submission was made** — no safe test mechanism exists, and a real submission would create a real lead and send real email.

### The previously-reported symptom: "lead is created in WordPress but the thank-you email is not received"

**Status: `[UNKNOWN]` — not confirmed, not refuted, and not assumed fixed.** This audit did not submit a live lead (per its own read-only constraint), so the actual current behavior in production cannot be stated as fact either way. What can be said from code review alone:

- The success/failure decision the user sees is driven entirely by the **WordPress REST response**, not by the email step — `contact.service.ts` only fires the Resend emails *after* WordPress returns `status: "success"`, and email failures are fired via `Promise.allSettled` so they can never flip an already-successful WordPress save into a user-facing error. This means the previously-reported symptom (WordPress save succeeds, email silently fails) is architecturally *possible* — the code is explicitly designed so a lead can be saved successfully while its notification/confirmation emails fail independently and invisibly to the user.
- Two concrete, verified reasons an email could fail today: (1) **locally**, `RESEND_API_KEY` and `EMAIL_FROM` in `.env.local` are literal, unfilled placeholder strings (`"PASTE_YOUR_RESEND_API_KEY_HERE"`, `"PASTE_YOUR_VERIFIED_SENDER_EMAIL_HERE"`) — confirmed by direct read — so local testing of the email leg has never actually been possible. (2) **Production** (Vercel) values for these same variables are unknown from this repository — whether they're real, valid Resend credentials cannot be determined without dashboard access.
- Storage is a deliberate two-option WordPress-side design (`TFF_LEAD_STORAGE_METHOD` wp-config.php constant, `'cpt'` or `'email'`); if **neither** is set, the endpoint correctly 500s rather than silently dropping data — but which state the live host is actually in can't be checked from outside WordPress.

**Required action, unchanged from what would resolve this regardless of root cause:** confirm the live `wp-config.php` constant and Vercel Production env values for the Resend/email variables, then submit one real test lead and confirm both (a) it appears in WordPress and (b) both emails (agency notification + lead confirmation) actually arrive. Do not mark this resolved until that test has been run and observed.

### Full pipeline trace `[VERIFIED, code-level]`

`ContactForm.tsx` (Client Component, react-hook-form + Zod, submit button `disabled` while `isSubmitting`) → a **Server Action** (`actions.ts`, `"use server"` — confirmed there is *no* `/api/contact` or `/api/leads` Next.js route) → `contact.service.ts` (re-validates with the identical Zod schema server-side) → `lead.repository.ts` → `POST cms.tffdigital.com/wp-json/headless/v1/leads` (same 8-second timeout pattern as every other WordPress fetch) → on success, two independent Resend emails fired via `Promise.allSettled`.

**Field contract, checked across all three layers** `[VERIFIED]`: the Zod schema, the `WPLeadRequestBody` TypeScript type, and the live WordPress REST arg schema (confirmed via a live GET to the REST index) all agree exactly on field names and required/optional status. This is the single most common way this kind of pipeline silently breaks, and no mismatch was found.

WordPress's handler (read in full) independently validates and sanitizes every field server-side — genuine defense-in-depth, not decorative. Email HTML output escapes all user-supplied fields before interpolation into HTML and the `Reply-To` header — no HTML/header-injection path found (see SEC-6).

- **FORM-2** (P2): No honeypot field, rate limiting, or CAPTCHA anywhere in the pipeline — frontend or WordPress — confirmed by their absence in both layers. A defensible gap for a low-traffic B2B form today.
- **FORM-3** (P2, new this pass): **The Footer and blog newsletter signup forms are UI-only stubs.** `Footer.tsx`'s `onSubscribe` handler sets a local `subscribed` boolean and shows "You're subscribed — thanks for joining" — no API call, no storage, no email captured anywhere. `[VERIFIED]` directly in `Footer.tsx` (also true of `src/components/blog/NewsletterSection.tsx`, the pattern `Footer.tsx` was deliberately made to match in a prior pass). This is not a bug in the sense of throwing an error — it behaves exactly as designed — but it silently discards every email a visitor enters while displaying a success message that implies otherwise. Every submitted address is lost.
- **NOT A TASK**: the `consent` field has no visible checkbox — it defaults to `true`, with agreement implied by static disclaimer text only. The code's own comment confirms this was a deliberate choice matching the Figma design. Flagging only for your own legal/compliance judgment.

---

## 8. Security Audit

Observational only — nothing was exploited. No real SSRF payloads, no injection attempts, no brute-forcing; only passive header/response inspection, source review, and intentionally-invalid preview secrets to confirm the auth gate rejects them.

**Confirmed sound** `[VERIFIED]`: preview secret comparison is genuinely constant-time (`crypto.timingSafeEqual` with a length-check short-circuit); all preview/email secrets are server-only, cross-checked against every `"use client"` file; no hardcoded secrets anywhere in the repo or plugin; `.gitignore` correctly excludes all `.env*` except `.env.example`; CSP/`X-Frame-Options`/`X-Content-Type-Options`/`Referrer-Policy`/`Permissions-Policy`/HSTS all live in production; the mshots website-preview feature validates the WordPress-editable Project URL and rejects the full private/loopback/link-local IP range before ever building an image URL — critically, this app's own server never fetches the target URL itself, it only builds an `<img>` src pointing at WordPress.com's mshots proxy, so residual SSRF exposure (if any) sits on WordPress.com's infrastructure, not this app's; the WordPress plugin's lead-persistence code uses `wp_insert_post()`/`meta_input` exclusively, no raw `$wpdb` SQL, no injection path found.

| ID | Issue | Severity | Evidence | Status | Action |
|---|---|---|---|---|---|
| SEC-1 | WordPress core REST API reflects any `Origin` header in `Access-Control-Allow-Origin`, with `Access-Control-Allow-Credentials: true` | MEDIUM | Live `OPTIONS` preflight against the leads endpoint with a fake cross-origin `Origin` | Confirmed live — WordPress core default (`rest_send_cors_headers`), not plugin-introduced | Low practical risk on this specific public/unauthenticated endpoint; review only if cookie-authenticated REST use beyond wp-admin is ever expected |
| SEC-2 | `/wp-json/wp/v2/users` publicly enumerates username "admin" | MEDIUM | Direct REST fetch (= CMS-4) | Confirmed live, standard WP default | Rename the admin account, or restrict via a security plugin |
| SEC-3 | No rate limiting or CAPTCHA anywhere (contact form, WordPress leads endpoint) | MEDIUM | Full read of both layers (= FORM-2) | Confirmed absent | Add a honeypot at minimum |
| SEC-4 | `npm audit`: 4 HIGH transitive vulnerabilities (nanoid, postcss ×3, sharp), all via `next` | HIGH (bundled, low real-world exploitability here) | `npm audit` output (= DEP-1) | Confirmed | nanoid: safe standalone fix; postcss/sharp: Next 15→16 major upgrade |
| SEC-5 | XML-RPC live with `pingback.ping`/`system.multicall` exposed | LOW–MEDIUM | Live POST `system.listMethods` (= CMS-3) | Confirmed live | Disable XML-RPC or block pingback specifically |
| SEC-6 | WordPress `'email'`-storage option builds the `Reply-To` header via string concatenation | LOW / INFO | Full read of the plugin's email code | Not exploitable today — WordPress's own `sanitize_*` calls upstream already strip CR/LF before the value reaches it | Optional defensive hardening if that code path is ever touched |
| SEC-7 | CSP `img-src` omits `secure.gravatar.com` even though `images.remotePatterns` includes it | INFO | `next.config.ts` vs. live CSP header | No functional impact — `next/image` always proxies through the app's own origin | Optional, for explicitness |
| SEC-8 | `readme.html` publicly reachable on the CMS; WordPress/Yoast versions disclosed | INFO | Direct fetch + generator meta tags | Standard WordPress/Yoast default | Optional hardening |

---

## 9. Performance Audit

Code review plus live response headers and production build output. **No synthetic Lighthouse run was performed — treat raw LCP/CLS/INP scores as `[UNKNOWN]`**; the findings below are the structural factors that drive them, distinguished explicitly from anything actually measured.

**PERF-1** (P2): **Service detail pages have no static generation or ISR — Case Study and Blog detail pages do.** `[VERIFIED]` three independent ways: production build output marks `/services/[slug]` as fully dynamic with no revalidate window, while `/case-studies/[slug]` and `/blog/[slug]` are SSG with a 60-second revalidate; live `Cache-Control` on a Service page is `private, no-cache, no-store` versus `public, max-age=0, must-revalidate` on a Case Study; and `services/[slug]/page.tsx` has no `generateStaticParams` export, unlike its Case Study equivalent. Every Service page visit is a live round-trip to WordPress with no cached fallback.

**What's already solid** `[VERIFIED]`: every image goes through `next/image`; fonts are self-hosted at build time via `next/font/google` (Poppins + Open Sans) with `display: "optional"`, the most conservative choice against layout shift; no third-party `<Script>` tags anywhere; `experimental.optimizePackageImports` enabled for `lucide-react` and `framer-motion`; homepage website-preview screenshots route through `next/image`, reusing the same optimizer cache as everything else; ~24% of `.ts/.tsx` files are Client Components (53 of 225) — a healthy ratio for a content-heavy marketing site; First Load JS ranges roughly 140–285KB across routes (Contact and Services heaviest), nothing alarmingly bloated. A prior audit pass measured **CLS: 0** on three routes via a real `PerformanceObserver` (a genuine measurement, not simulated) — not re-measured this pass but no code change since would plausibly affect it.

- **PERF-2** (P1): **No web analytics instrumented anywhere** — no Vercel Analytics/Speed Insights package in `package.json`, no GA4, no `gtag`. Confirmed directly against the dependency list.
- **PERF-3** (P3): No `loading.tsx` anywhere in the route tree — confirmed by direct listing — so no streaming loading UI exists for any route, including the fully-dynamic `/services/[slug]` and `/case-studies`.
- **SEO-3 (repeat)**: the 2MB unoptimized blog OG image is as much a performance concern as an SEO one.
- LCP/FCP were explicitly attempted and found unmeasurable in a prior audit's browser-automation environment (hidden-tab paint-timing suppression, a genuine tooling constraint, correctly reported as `[UNKNOWN]` rather than fabricated) — not re-attempted this pass; still `[UNKNOWN]`.

---

## 10. UX / Responsive Audit

> **Coverage gap, disclosed rather than papered over.** The browser automation's viewport-resize tool did not reliably change the actual rendered viewport across **three independent sessions** during this audit — `window.innerWidth` stayed pinned to the host's native resolution regardless of the requested size, and screenshots stayed a fixed size across every request. This has been reported as a product bug. **Every UX finding below marked "Desktop" was verified at a single, effectively-desktop viewport. True tablet (≥768px) and mobile (≤400px) breakpoints are `[UNKNOWN]` in this audit** — not a claim that responsive behavior works or fails, an open gap to close with a real device or a fixed tool in a follow-up pass.

**Desktop** `[VERIFIED]`: Home, About, Services listing, a Service detail page, Case Studies listing, a Case Study detail page, Blog listing, the Blog detail page, Contact, Privacy Policy, and Terms all render cleanly — no clipping, overflow, or broken spacing observed on any of them. The previously-fixed testimonial-card hover-clipping bug (commit `c80965a`) holds. The homepage's website-preview screenshots (ChicaBebo, RoyaltyMirror) render real, fully-loaded images. Contact form: all 6 fields have properly-associated `<label for>`; submitting empty produces specific, correctly-scoped per-field errors; the FAQ accordion uses real `<button>` elements with correct `aria-expanded`/`aria-controls`. The footer correctly displays `info@tffdigital.com` and `+91 72068 09816` in the rendered DOM. 404 page: clear messaging, "Back to home" and "Visit the blog" CTAs, full footer retained.

**Tablet** `[UNKNOWN]` — see coverage-gap note above. Indirect evidence only: extensive `sm:`/`lg:` Tailwind responsive classes throughout every component read.

**Mobile** `[UNKNOWN]` — see coverage-gap note above. Indirect evidence only: a dedicated client `Navbar.tsx` with mobile-specific open/close/backdrop/scroll-lock logic exists in source (this exact scroll-lock + backdrop pairing was a genuine bug found and fixed in a prior audit pass — the fix is present in current source, not re-verified live this pass due to the tooling gap above).

**Findings** (all desktop-verified):

| ID | Finding | Severity |
|---|---|---|
| UX-1 | Contact form's 4 visually-required fields lack `required`/`aria-required` — confirmed in live DOM | P3 |
| UX-2 | Mobile-menu hamburger button sets a dynamic `aria-label` but has no `aria-expanded`/`aria-controls`, inconsistent with the correctly-built FAQ accordion elsewhere | P3 |
| UX-3 | On `/services`, only 2 of ~9 discipline cards link anywhere; the rest render as dead-end cards | P3 |
| UX-4 | Homepage testimonial cards use raw Upwork review titles as heading text rather than the reviewer's name/role | P3 |
| UX-5 | Mobile nav menu does not close on <kbd>Escape</kbd> (confirmed via before/after screenshot comparison) | P3 |
| UX-6 | Footer service links are inconsistent — 2 of the listed disciplines link to real pages, the rest fall back to the generic `/services` listing | P3 |

---

## 11. Accessibility Audit

`[VERIFIED]`: Skip-to-main-content link present, visually hidden until focused. Clean heading hierarchy on every page checked — one `h1`, logical nesting, no skipped levels (a prior pass also fixed a specific `/case-studies` H1→H3 skip; confirmed still bridged). Proper landmark structure (`banner`, `navigation` with a real breadcrumb list, `main`, `article`, `contentinfo`). The shared `Input` component correctly pairs `<label for>` with `id` sitewide, plus `aria-invalid`/`aria-describedby` wired to its error message (a prior pass added this; confirmed live). Nav and footer links are real semantic `<a href>` elements throughout, with correct `mailto:`/`tel:`/social URLs — all now real, functioning links (see §13). Focus states are visible, not stripped by a CSS reset. Body text contrast measured at roughly 13:1 — comfortably exceeds WCAG AAA.

- **A11Y-1** (P3): Case-study result stats (e.g. "382" / "Ranking Keywords") render as two adjacent but programmatically unrelated text nodes — no `dl/dt/dd` or `aria-label` ties the number to its caption.
- **A11Y-2** (P3): The footer newsletter-signup field's accessible name may rest on its placeholder rather than a real label, unlike the shared `Input` component used everywhere else — flagged from one research pass, not independently confirmed against raw HTML.
- **A11Y-3** (P3, new this pass): **Primary CTA gradient button text fails WCAG AA contrast at its lower end.** `[VERIFIED]`: the brand gradient tokens (`--color-primary: #3882f6`, `--color-secondary: #8b5cf6` in `src/styles/tokens.css`) are unchanged since a prior audit pass calculated white button text against the purple end of this exact gradient at **~3.69:1** — below the 4.5:1 AA threshold for text under 18.66px-bold. This button variant (`buttonVariants({variant: "primary"})`) is used sitewide (every primary CTA). This is a known, previously-flagged, deliberately-not-fixed design decision (fixing it means changing brand colors) — not a new defect, but still open.

`[UNKNOWN]`: Screen-reader behavior was not tested with an actual assistive-technology tool (VoiceOver/NVDA) — accessibility-tree inspection is a proxy, not a substitute. Color contrast beyond the specific measurements above was assessed by spot-check, not a full automated sweep.

---

## 12. Deployment / Infrastructure

Everything visible from the repository or public DNS was checked directly. Everything living only in a dashboard is marked `[UNKNOWN]` rather than guessed.

| Item | Status | Evidence |
|---|---|---|
| Hosting | — | Vercel (frontend) · Bluehost shared hosting, India (CMS) |
| DNS | `[VERIFIED]` | `www`/apex → Vercel edge IPs; nameservers still `ns1/ns2.bluehost.in`; `cms` → `119.18.49.42` (Bluehost); apex MX → Microsoft 365 |
| `vercel.json` / region pinning | Absent | Confirmed not in repo — functions run in default `iad1` (US East), a ~1.3s latency floor to the Mumbai-hosted CMS |
| CI/CD pipeline | None | `.github/workflows` confirmed absent |
| Production env var values | `[UNKNOWN]` | Dashboard-only; local `.env.local` has empty preview secrets and placeholder Resend keys — see §7 |
| `wp-config.php` constants | `[UNKNOWN]` | Not in this repo; behaviorally the preview secret is confirmed *configured* (the 401 gate is live) even though its value is unknown |
| Deployed commit vs. `main` HEAD | `[VERIFIED]` consistent | Every live behavior checked (v1.4.0 routing, real contact info, mshots feature) matches the latest commits in `git log` — strong indirect evidence, not a dashboard confirmation |
| Bluehost IP temp-ban / CMS reliability | Root-caused, ticket status `[UNKNOWN]` | Root cause diagnosed in a prior session (per-IP packet-level temp-bans, ~20 min); frontend hardening (8s timeouts, ISR stale-serve) already shipped |
| Uptime / error monitoring | `[UNKNOWN]` | No monitoring config found in repo; may exist purely in a dashboard |

**INFRA-4** (P3): Bare apex `http://` takes two redirect hops to reach the canonical `https://www.` URL instead of one. Cosmetic — both land correctly.

---

## 13. Content / Data Quality

**Real, complete content** `[VERIFIED]`: 2 real Case Studies (ChicaBebo, RoyaltyMirror), both structurally complete, both with working external Project URLs (live-checked, both 200); 1 real Blog post with substantial, well-structured copy; 6 verbatim client testimonials (Upwork-sourced; code comment explicitly forbids paraphrasing); 6 real team members with photos and personal bio lines (transcribed verbatim from a source deck, per an explicit "do not invent" code comment); 6 real FAQ entries; real founder profiles (Raju Gorai, Kanchan Rana) with photos in `AboutJourney.tsx`; a real, verifiable Upwork trust-badge section (100% Job Success, Top Rated Plus, 72 jobs, 9,444 hours, linking to a real freelancer profile).

**Needs an editorial pass, confirmed live:** 7 WordPress Service posts — genuine, structured drafts rather than lorem-ipsum junk, but visibly mid-iteration: *"AI Consulting Updated"*, *"AI Automation Updated"*, *"Web Development 2"*; one entry's `shortDescription` literally reads *"THIS IS LIVE DESCRIPTION TEST"*; another has null `shortDescription`/`description`/`displayOrder`. 6 WordPress Projects entries, real-looking names, structurally disconnected from the frontend (§2, ARCH-2). Blog post author display name is still the generic "admin". No lorem ipsum or fabricated metrics found anywhere in live-rendered content; no broken external links found among the content checked.

### Historical resolutions (context preserved from superseded audit docs, now deleted — see cleanup log)

Several earlier audit passes documented real content problems that have since been fixed and were re-verified live during this pass, not assumed:
- **Fabricated testimonials/team/trust-signal content**: an earlier pass found `Testimonials.tsx` showing 3 invented named quotes (Sarah Liu/Cascade Health, etc.), `Team.tsx` showing 4 identical literal "Name"/"Position" cards, and `TrustedBrands.tsx` showing "Halcyon" ×8 fake client logos. `[VERIFIED]` fresh this pass: all three are now real — `TrustedBrands.tsx` was fully rewritten into the real Upwork trust badge above; `team.ts` now holds 6 real, verbatim-sourced bios; testimonials are real and Upwork-sourced.
- **Conflicting/fake contact info**: an earlier pass found two different display emails (`hello@targetfindfinish.com` vs. `hello@tffdigital.com`), two different fake US "555" phone numbers, a social-platform mismatch between the Contact page and Footer, and no functioning `mailto:`/`tel:` links anywhere. `[VERIFIED]` fresh this pass: both files now show one consistent email (`info@tffdigital.com`) and one consistent phone number (`+91 72068 09816`), both as real functioning `mailto:`/`tel:` links, and both files now import social URLs from a single shared `SOCIAL_LINKS` constant with real platform URLs (X, Instagram, LinkedIn, Facebook, Pinterest) — no more `href="#"` placeholders.
- **Case Study "Test" entry**: an earlier pass found a published "Test" case study (dbId 110, every field literally the word "Test", `projectUrl` = google.com) live on the site, sitemap, and homepage. Already confirmed deleted from WordPress in prior-session memory; not independently re-verified this pass beyond confirming today's 2 real case studies don't include it.

---

## 14. Dependencies / Code Quality

| Check | Result |
|---|---|
| `npx tsc --noEmit` | **PASS** — zero type errors, strict mode |
| `npm run lint` | **PASS** — zero ESLint errors/warnings |
| `npm run build` | **PASS** — 25 routes generated, no errors |
| `npm audit` | 4 HIGH, 0 CRITICAL |
| Automated test suite | **None found** — no Jest/Vitest/Playwright config, no `*.test.*`/`*.spec.*` files |
| `npm outdated` | Next.js and TypeScript each one major version behind; everything else minor/patch drift |

**DEP-1** (P2): npm audit detail —

| Package | Issue | Fix path |
|---|---|---|
| `nanoid <3.3.18` | Indefinite loop when size is zero (GHSA-2v37-7h3g-55p8) | Safe, isolated `npm audit fix` — non-breaking |
| `postcss ≤8.5.22` | 4 advisories incl. XSS via unescaped `</style>`, path-traversal via `sourceMappingURL` | Bundled inside `next` — needs a Next 15→16 major upgrade |
| `sharp <0.35.0` | 4 inherited libvips CVEs | Same — bundled inside `next`, resolved by the same major upgrade |

- **DEP-2** (P2): Zero automated tests anywhere — type-checking and linting are the only current safety nets.
- **DEP-3** (P3): Next.js and TypeScript are each one major version behind; low urgency.
- Exactly 7 `TODO: RESTORE WORDPRESS DATA` markers, one consistent theme, across 5 files. No `FIXME`s found anywhere. Two (now three, with ARCH-4) fully dormant architecture layers confirmed unused by direct grep, not assumption.
- Build output is a useful secondary signal given zero test coverage: it correctly prerendered exactly the real live slugs for both Case Studies and the one Blog post via `generateStaticParams`, confirming the build-time WPGraphQL fetch genuinely reaches the live CMS.

---

## 15. Complete Live Route Matrix

| Route | Status | Canonical | Robots | Content Source | Indexable | Notes |
|---|---:|---|---|---|---|---|
| `/` | 200 | www ✓ | index | mixed | Yes | Leaks `cms.tffdigital.com` URLs into hydration payload (SEO-2) |
| `/about` | 200 | www ✓ | index | static | Yes | Clean |
| `/services` | 200 | www ✓ | index | hardcoded | Yes | Not dynamically enumerated in sitemap |
| `/services/seo` | 200 | www ✓ | index | static | Yes | Bespoke page, no WP slug collision |
| `/services/smm` | 200 | www ✓ | index | static | Yes | Bespoke page, no WP slug collision |
| `/services/<slug>` (×7 live) | 200 | self ✓ | **noindex, nofollow** | WordPress | No | Live, unlinked from nav/sitemap; e.g. desc "THIS IS LIVE DESCRIPTION TEST" |
| `/case-studies` | 200 | www ✓ | index | WordPress | Yes | `Cache-Control: private, no-cache` (dynamic, strict) |
| `/case-studies/stabilizing-…` | 200 | self ✓ | **noindex, nofollow** | WordPress | No | P0 — SEO-1 |
| `/case-studies/unlocking-…` | 200 | self ✓ | **noindex, nofollow** | WordPress | No | P0 — SEO-1 |
| `/blog` | 200 | www ✓ | index | WordPress | Yes | `Cache-Control: private, no-cache` |
| `/blog/seo-for-small-businesses` | 200 | self ✓ | **noindex, nofollow** | WordPress | No | P0 — SEO-1; og:image 2.03MB (SEO-3); og:type wrong (SEO-4) |
| `/blog/category/seo` | 200 | self ✓ | index | WP taxonomy | Yes | Real term; fabricated categories/tags correctly 404 |
| `/contact`, `/privacy-policy`, `/terms-and-conditions` | 200 | www ✓ | index | static | Yes | Clean |
| `/sitemap.xml` | 200 | — | — | — | — | 13 URLs, all www; does not enumerate `/services/[slug]` |
| `/robots.txt` | 200 | — | — | — | — | `Allow: /`, correct sitemap line, no CMS refs, no Disallow rules (SEO-6) |
| Unknown/deleted slug (all 3 types) | 404 | — | noindex | — | — | Clean; blog 404 title inconsistent (SEO-5) |
| `http(s)://tffdigital.com` (apex) | 301/308 → www | — | — | — | — | 2-hop on bare http (INFRA-4) |
| `/about/` (trailing slash) | 308 → `/about` | — | — | — | — | Normalized correctly |
| `/?utm_source=test&foo=bar` | 200 | clean (no query) | index | — | Yes | `x-vercel-cache: STALE`, ISR ignores query string |
| `[slug]?preview=true`, no cookie | 200 | self | as published | WordPress | — | No draft-mode bypass |
| `cms.tffdigital.com/` | 200 | — | **noindex, nofollow** | — | No | Headless hardening active; individual post URLs still directly reachable too (CMS-8) |

---

# 16. MASTER FINDINGS

Every actionable finding from §2–15, deduplicated and cross-referenced, ranked by severity.

| ID | Finding | Evidence | Severity | Category | Current Status | Required Action | Claude Can Do? | Manual Action? |
|---|---|---|---|---|---|---|---|---|
| SEO-1 | All 10 real WP posts (2 case studies, 7 services, 1 blog) noindexed live; sitemap lists 3 as indexable | Direct GraphQL `seo.metaRobotsNoindex` query, 10/10; matching rendered `<meta>` on every URL with a route | **P0** | SEO | Confirmed live | Toggle Yoast indexability — check Content Types default first, since the 100%-with-zero-exceptions pattern suggests one setting, not 10 mistakes | NO | wp-admin → Yoast (≈2 min/post, or one settings change) |
| ARCH-1 | Services listing/homepage hardcoded while detail route already live-renders real (unlinked) WP content | `temporary-services.ts`, live `/services/<slug>` fetches | P1 | Architecture | Confirmed | Clean up WP service copy, then flip the 5 tracked TODOs | PARTIALLY | Write/approve real service copy in wp-admin |
| SEO-2 | Homepage hydration payload leaks raw Yoast JSON-LD incl. `cms.tffdigital.com` URLs | Page-source grep, `SelectedWork.tsx` prop trace | P1 | SEO | Confirmed live | Stop passing `seo`/`seo.jsonLd` into `SelectedWork`'s client props | YES | — |
| CTP-1 | Blog Post Preview not implemented (View only) — deliberate, documented gap | No `/api/preview/post` route, no preview fn in `post.service.ts` | P1 | Feature | Confirmed absent | Build the preview path + route when prioritized | YES | — |
| FORM-1 | Lead pipeline never verified end-to-end; storage backend unknown; local email keys are placeholders; the previously-reported "no email" symptom cannot be confirmed or refuted | `wp-config.php` unreadable remotely; `.env.local` literal placeholder strings (verified) | P1 | Forms | **UNKNOWN — see §7** | Confirm wp-config.php + Vercel env vars, then run one real test lead | PARTIALLY | Check wp-config.php; submit + confirm a real lead end-to-end |
| CMS-2 | Yoast XML sitemap still serves live despite the plugin trying to disable it | `sitemap_index.xml` 200, 10 sub-sitemaps | P1 | SEO/CMS | Confirmed | wp-admin toggle, or a deeper fix for the correct hook on this Yoast version | PARTIALLY | Yoast → Settings → Site features → XML sitemaps → Off |
| INFRA-1 | Bluehost shared host temp-bans Vercel's source IP after request bursts, causing intermittent CMS fetch failures | Root-caused in a prior session; frontend hardening shipped | P1 | Infra | Confirmed, unresolved externally | Frontend hardening already shipped; root fix needs a hosting ticket | NO | Open/follow up a Bluehost ticket re: firewall IP-ban thresholds |
| PERF-2 | Zero web analytics instrumented anywhere on production | `package.json` dependency check | P1 | Performance | Confirmed | Add an analytics package/snippet | YES | Decide which provider |
| ARCH-2 | Complete unused "Portfolio" layer maps to a real WP "projects" CPT with 6 published entries | `grep` zero consumers; live REST confirms the CPT + 6 entries | P2 | Architecture | Confirmed | Decide: build the `/projects` route, or remove the layer | YES (either) | Decide direction |
| ARCH-3 | `WORDPRESS_USE_MOCK_DATA` silently wins over a configured endpoint | `wordpress.config.ts` logic read | P2 | Architecture | Confirmed | Add a guarding comment; confirm unset in Vercel Production | YES | Confirm Vercel Production env vars |
| PERF-1 | `/services/[slug]` has no `generateStaticParams`/ISR, unlike Case Study/Blog | Build output, live `Cache-Control` headers, source read | P2 | Performance | Confirmed | Add `generateStaticParams` + revalidate, matching Case Study | YES | — |
| DEP-1 | `npm audit`: 4 HIGH (nanoid, postcss, sharp), 2 of 3 tied to a Next.js major upgrade | `npm audit` output | P2 | Dependencies | Confirmed | Fix nanoid now; schedule the Next 16 upgrade for the rest | PARTIALLY | Approve the upgrade window |
| DEP-2 | Zero automated test coverage anywhere in the repo | Direct search, no test config/files | P2 | Code quality | Confirmed | Scaffold tests, starting with preview + lead-pipeline paths | YES | — |
| INFRA-2 | No CI/CD pipeline exists | `.github/workflows` confirmed absent | P2 | Infra | Confirmed | Add a GitHub Actions lint/typecheck/build workflow | YES | Enable/connect it on GitHub |
| FORM-2 | No spam/rate-limit/CAPTCHA protection on the contact form or its WordPress endpoint | Full read of both layers | P2 | Forms/Security | Confirmed absent | Add a honeypot field at minimum | YES | CAPTCHA, if ever needed, requires a provider account |
| FORM-3 | Newsletter signup (Footer + blog) is a UI-only stub — shows a fake success message, captures no email anywhere | Direct read of `Footer.tsx`/`NewsletterSection.tsx` | P2 | Forms/Content | Confirmed live | Wire to a real backend (Resend Audience or a small WP endpoint), or remove the forms until one exists | PARTIALLY | Decide the newsletter backend/provider |
| SEC-1 | WordPress core CORS reflects any Origin + credentials:true across the REST API | Live `OPTIONS` preflight test | P2 | Security | Confirmed live, WP-core default | Review if cookie-authenticated REST use beyond wp-admin is ever expected | PARTIALLY | WP security plugin/header rule, if desired |
| SEC-2 | `wp-json/wp/v2/users` publicly enumerates username "admin" | Live REST fetch | P2 | Security | Confirmed live | Rename the admin account, or restrict via a security plugin | NO | wp-admin user management |
| CMS-3 | XML-RPC live with `pingback.ping`/`system.multicall` exposed | Live POST `system.listMethods` | P2 | Security | Confirmed live | Disable XML-RPC or block pingback specifically | YES (plugin filter) | Needs plugin re-upload after the change |
| CMS-4/SEO-7 | Both case studies missing native featured images; detail pages have no unique OG image | GraphQL `featuredImage: null` on both, live meta fetch | P2 | Content/SEO | Confirmed live | Add featured images in wp-admin, or wire the existing screenshot feature into `buildMetadata` | PARTIALLY | wp-admin, or approve the code-side option |
| CMS-9 | 7 WordPress Service entries carry visible test/placeholder copy | Live GraphQL field values | P2 | Content quality | Confirmed live | Editorial cleanup before the listing goes live | NO | wp-admin content edit |
| ARCH-4 | `navigation.repository`/`.service` fully built, zero consumers — Navbar/Footer both hardcode their own link arrays | `grep` zero consumers | P3 | Architecture | Confirmed | Keep as-is (low cost) unless CMS-driven nav becomes a goal | YES | Decide intent |
| SEO-3 | Blog post's Yoast-set og:image is a separate 2.03MB unoptimized upload; native featured image is unset | Live `Content-Length` measurement + GraphQL/REST cross-check | P3 | SEO/Perf | Confirmed | Re-upload a compressed image; consider a native featured image too | PARTIALLY | WP media re-upload |
| SEO-4 | Blog post `og:type` is "website", should be "article" | Live meta fetch | P3 | SEO | Confirmed | One-line metadata fix | YES | — |
| SEO-5 | `/blog/[slug]` 404 shows a generic title instead of "Page not found" | Live fetch comparison across 4 404 paths | P3 | SEO consistency | Confirmed | Add the missing metadata export | YES | — |
| SEO-6 | `robots.txt` has no Disallow rules; `/api/*` technically crawlable | robots.txt fetch | P3 | SEO | Confirmed, low risk | Optionally add `Disallow: /api/` | YES | — |
| CMS-1 | `X-Robots-Tag` directive value inconsistent across CMS endpoints | Header dump across 4 endpoints | P3 | SEO cleanup | Confirmed | Normalize if desired — net effect unaffected | YES (if plugin-controlled) | — |
| CMS-5 | RoyaltyMirror case study has a leaked rich-text-editor artifact in its solution field HTML | Live GraphQL field content | P3 | Content quality | Confirmed | Clean up the markup in wp-admin | NO | wp-admin edit |
| CMS-6 | Yoast emits no canonical tag at all on any CMS content type | GraphQL `seo.canonical: ""` on all checked types | P3 | SEO/technical | Confirmed | Harmless today; investigate if the CMS is ever used more directly | PARTIALLY | — |
| CMS-7 | CMS-native URLs remain directly reachable, not redirected, alongside new frontend View links | Direct fetch, 200, WP theme | P3 | Architecture/SEO | Confirmed | Optionally add a real 301 from CMS single-post URLs to the frontend | YES | Needs plugin re-upload |
| SEC-6 | Email `Reply-To` header built via string concat | Full read of plugin email code | P3 | Security | Not exploitable today | Optional defensive hardening | YES | — |
| PERF-3 | No `loading.tsx` anywhere in the route tree | Direct listing, confirmed absent | P3 | Performance/UX | Confirmed | Add to fully-dynamic routes if perceived performance becomes a concern | YES | — |
| DEP-3 | Next.js and TypeScript each one major version behind | `npm outdated` | P3 | Dependencies | Confirmed | Routine maintenance pass | YES | — |
| INFRA-4 | Bare apex `http://` takes 2 redirect hops instead of 1 | Redirect chain test | P3 | Infra | Confirmed | Optionally collapse to a single hop | PARTIALLY | Vercel domain redirect config |
| UX-1 | Contact form's 4 required fields lack `required`/`aria-required` | Live DOM check | P3 | Accessibility | Confirmed | Add `aria-required` to the 4 asterisked fields | YES | — |
| UX-2 | Mobile hamburger button lacks `aria-expanded`/`aria-controls` | Source read | P3 | Accessibility | Confirmed | Add `aria-expanded` + `aria-controls` + `id` on the panel | YES | — |
| UX-3 | Services listing: most discipline cards are dead-ends, only 2 of ~9 link out | Live `href` extraction | P3 | UX consistency | Confirmed | Decide: build remaining detail pages, or drop the implied-link affordance | PARTIALLY | Content/architecture decision |
| UX-4 | Testimonial headings use raw Upwork review titles, not person/role | Live heading extraction | P3 | UX polish | Confirmed | Small copy/data fix | YES | — |
| UX-5 | Mobile nav menu doesn't close on Escape | Before/after screenshot comparison | P3 | UX polish | Confirmed | Add an Escape-key handler | YES | — |
| UX-6 | Footer service links inconsistent — 2 of 6 go to real pages, rest fall back to `/services` | Live `href` extraction | P3 | UX polish | Confirmed | Small fix | YES | — |
| A11Y-1 | Case-study result stats lack semantic number-to-label grouping | Live DOM structure | P3 | Accessibility | Confirmed | Use `dl/dt/dd` or `aria-label` | YES | — |
| A11Y-2 | Footer newsletter field's label association unconfirmed | One research pass, not independently re-verified | P3 | Accessibility | Partially confirmed | Verify against raw HTML; fix if missing | YES | — |
| A11Y-3 | Primary CTA gradient button text ~3.69:1 contrast, below WCAG AA | Calculated against unchanged design tokens | P3 | Accessibility | Confirmed, known design tradeoff | Requires a brand-color decision | PARTIALLY | Client/designer sign-off on any brand-color change |
| SEC-7/SEC-8 | CSP `img-src` omits gravatar.com (no functional impact); `readme.html` reachable; WP/Yoast versions disclosed | Header/source checks | INFO | Security | Confirmed, no action required | Optional hardening only | YES | — |

---

# 17. P0 — MUST FIX

**SEO-1 — 10 real content pages are noindexed live.** Both case studies, the blog post, and all 7 services — the entirety of TFF Digital's unique editorial content — are invisible to search engines right now, while the sitemap tells Google to index three of them. This is the one thing actually blocking the SEO work already shipped from paying off. Root cause is a WordPress/Yoast setting, not code. Fix: wp-admin, ≈20 minutes total (check Yoast → Search Appearance → Content Types defaults first, since the pattern spans three content types with zero exceptions).

No other P0 issues were identified.

---

# 18. P1 — PENDING TASKS

Required to finish work this project already started — not new scope.

1. **ARCH-1** — Finish the Services migration: clean up WordPress service copy, then flip the 5 tracked TODOs so the listing/homepage grid use live data (the code path already exists).
2. **SEO-2** — Stop the homepage's CMS-URL payload leak by narrowing `SelectedWork`'s client props.
3. **CTP-1** — Build Blog Post preview, mirroring the existing Case Study/Service pattern, when prioritized.
4. **FORM-1** — Verify the lead pipeline end-to-end: confirm the WordPress storage constant and production email keys are real, then run one real test lead and confirm delivery. Do not consider this resolved without that test.
5. **CMS-2** — Fully disable the Yoast XML sitemap (wp-admin toggle).
6. **INFRA-1** — Follow up the Bluehost IP-ban support ticket.
7. **PERF-2** — Instrument web analytics; the agency currently has zero first-party visibility into its own site's traffic or conversions.

---

# 19. P2 — SEO / SECURITY / TECHNICAL CLEANUP

Non-blocking but real, worth doing at a normal pace: **ARCH-2** (decide the Portfolio/Projects feature's fate), **ARCH-3** (guard against `WORDPRESS_USE_MOCK_DATA` ever reaching Production), **PERF-1** (add static generation/ISR to Service detail pages), **DEP-1** (fix the safe npm vulnerability now; schedule the Next 16 upgrade), **DEP-2** (stand up a test suite), **INFRA-2** (add a CI pipeline), **FORM-2** (basic spam protection on the contact form), **FORM-3** (fix or remove the non-functional newsletter signup), **SEC-1** (review WordPress's permissive REST CORS default), **SEC-2** (address the enumerable "admin" username), **CMS-3** (disable XML-RPC pingback/multicall), **CMS-4/SEO-7** (add featured images to both case studies), **CMS-9** (editorial cleanup on the 7 WordPress Service entries).

---

# 20. P3 — IMPROVEMENTS / POLISH

UX, accessibility, performance, and maintainability refinements — worth the time once content and indexing are correct: **SEO-3 through SEO-6** (OG image compression, og:type fix, blog 404 title, robots.txt tightening), **CMS-1, CMS-5, CMS-6, CMS-7** (X-Robots-Tag consistency, editor-artifact cleanup, empty canonical, dangling CMS URLs), **SEC-6** (Reply-To header hardening), **PERF-3** (`loading.tsx`), **DEP-3** (routine dependency bumps), **INFRA-4** (single-hop apex redirect), **UX-1 through UX-6** (form aria-required, hamburger aria state, dead-end service cards, testimonial headings, Escape-to-close, footer link consistency), **A11Y-1 through A11Y-3** (semantic stat grouping, newsletter label, CTA button contrast), **ARCH-4** (dormant navigation layer — low cost either way).

---

# 21. NOT A TASK — WORKING AS DESIGNED

- **Plugin v1.4.0's View/Preview routing is fully live** — nothing left to upload. The biggest status correction in this audit.
- **Testimonials, Team, and FAQ staying hardcoded** — no frontend code touches their WordPress equivalents by design, confirmed by both the plugin's own routing comment and direct grep.
- **`/services/seo` and `/services/smm` existing alongside the dynamic route** — confirmed no WordPress service uses those slugs; genuinely separate bespoke pages.
- **Preview auth mechanics** — constant-time secret comparison, generic 401s that don't fingerprint server state, forced noindex on every draft render, a non-reflected redirect target — sound end-to-end, live-tested.
- **`?preview=true` doing nothing without the real cookie** — cosmetic only, by design; the httpOnly Draft Mode cookie is the real gate. Live-tested, no leak.
- **The strict/soft resilience split** — some data-fetching functions throw loud, others fail empty — a deliberate, consistently-applied pattern, not an inconsistency.
- **Missing `not-found.tsx` for case-study/service detail routes** — falls through to the root boundary correctly, live-tested.
- **Domain canonicalization** (apex→www, trailing slash, query-string stripping) — fully re-verified this pass, zero regressions across every route tested.
- **Leads CPT correctly private** — `public => false`, `show_in_rest => false`, zero REST/GraphQL read exposure, deliberate.
- **GraphQL introspection disabled for public requests** — good default hardening, confirmed live.
- **`/wp-json/wp/v2/plugins` correctly requires auth** — no plugin enumeration possible via REST.
- **The case-study "test" placeholder filter** — now purely defensive/unused since the real WP "Test" entry was deleted; correctly left in place regardless.
- **SSRF surface on the mshots website-preview feature** — validated allowlist, and this app's own server never fetches the target URL — only WordPress.com's proxy does.
- **Security headers and HSTS** — CSP, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS all live, all well-configured.
- **No hardcoded secrets; `.env*` correctly gitignored** — full pattern sweep plus direct git-tracked-files check.
- **Consent implied by disclaimer text, no checkbox** — a deliberate choice per the code's own comment, matching a Figma design with no checkbox field. Worth your own legal/compliance judgment, not a code defect.
- **Contact info, testimonials, team, and trust-signal content** — previously fabricated/conflicting in earlier audit rounds, now confirmed real and consistent (§13). Not an open item.

---

# 22. FUTURE / OPTIONAL

Not required for the current site. Worth pulling forward only when there's a specific reason to.

1. **Build a frontend route for the Projects/Portfolio CPT** — 6 real WordPress entries are already waiting behind a fully-built, unwired data layer; only worth it if Projects should be public-facing.
2. **Nonce-based CSP** — would drop the current `'unsafe-inline'` script-src allowance; explicitly deferred in `next.config.ts`'s own comments pending a middleware-based rewrite.
3. **Pin the Vercel function region to `bom1`** — would cut the Mumbai round-trip latency to the CMS.
4. **Plan the Next.js 15→16 major upgrade** — closes the postcss/sharp CVEs as a side effect; a deliberate project, not a drive-by bump.
5. **Google Search Console setup** — verify the www property, submit the sitemap, request re-indexing once SEO-1 is fixed. Needs your Google account — Claude has no path to this at all.
6. **Migrate Testimonials/Team/FAQ to WordPress-editable content** — only if editorial convenience ever outweighs the simplicity of the current static data.
7. **`FAQPage`/`Service`-type JSON-LD** — a real SEO enhancement opportunity, not a fix to something broken; nothing is currently malformed without it.

---

# 23. CLAUDE CAN DO

**Implement directly in the repository:**
- Stop the `SelectedWork` prop leak (SEO-2)
- Fix blog `og:type` and the blog 404 title (SEO-4, SEO-5)
- Add `generateStaticParams` + ISR to Service detail pages (PERF-1)
- Restore WordPress data to the Services listing/homepage grid once content is clean (ARCH-1)
- Add a guarding comment around `WORDPRESS_USE_MOCK_DATA` (ARCH-3)
- Add `aria-required`, `aria-expanded`/`aria-controls`, and semantic stat grouping (UX-1, UX-2, A11Y-1)
- Add an Escape-key handler to the mobile nav; fix footer service link consistency (UX-5, UX-6)
- Add a honeypot field to the contact form (FORM-2)
- Run the safe `nanoid` fix; prepare (not execute unapproved) a Next 15→16 upgrade plan (DEP-1)
- Scaffold a test suite and a CI workflow, once wanted (DEP-2, INFRA-2)
- Wire analytics once a provider is chosen (PERF-2)
- Build Blog Post preview, mirroring the existing pattern (CTP-1)
- Either build out or remove the Portfolio/Projects layer, once direction is decided (ARCH-2)
- Wire the newsletter forms to a real backend, or remove them, once a decision is made (FORM-3)

**Prepare for WordPress (still needs your upload/approval):**
- Write a plugin filter to disable XML-RPC pingback/multicall (CMS-3)
- Write a plugin filter to 301-redirect CMS-native single-post URLs to the frontend (CMS-7)
- Normalize the `X-Robots-Tag` directive across CMS endpoints (CMS-1)
- Draft the exact wp-admin steps for the Yoast indexability + sitemap-off settings as a written runbook, if useful

---

# 24. MANUAL USER ACTIONS

**wp-admin:**
- Toggle indexability — check Yoast → Search Appearance → Content Types defaults first (SEO-1, the P0)
- Turn off Yoast XML sitemaps under Settings → Site features (CMS-2)
- Confirm the `TFF_LEAD_STORAGE_METHOD` constant in `wp-config.php` (FORM-1)
- Clean up the 7 Service entries' titles/descriptions (ARCH-1, CMS-9)
- Add featured images to both case studies (CMS-4); clean the RoyaltyMirror markup artifact (CMS-5)
- Rename the "admin" user, if addressing SEC-2

**Vercel dashboard:**
- Confirm Production values for `WORDPRESS_USE_MOCK_DATA`, `RESEND_API_KEY`, `EMAIL_FROM`, and the preview-secret trio (FORM-1, ARCH-3)
- Confirm the deployed commit matches `main` HEAD
- Optionally pin the function region to `bom1`

**External systems / credentials Claude doesn't have:**
- Submit one real contact-form lead and confirm both emails arrive + a record appears in WordPress (FORM-1)
- Follow up the Bluehost support ticket re: IP temp-bans (INFRA-1)
- Set up Google Search Console once SEO-1 is fixed — your Google account, no Claude path exists
- Approve/schedule the Next.js 16 major-version upgrade before it starts (DEP-1)
- Decide the Projects/Portfolio feature's fate (ARCH-2) and the newsletter backend/provider (FORM-3) — product calls, not technical ones
- Decide whether the CTA button's brand-color contrast (A11Y-3) is worth changing

---

# 25. RECOMMENDED EXECUTION ORDER

1. **SEO-1** (P0, wp-admin, ≈20 minutes) — fix before anything else touches these pages; every day open is invisible search traffic.
2. **FORM-1** (P1, dashboard check + one real test) — confirm the business's actual lead intake works; do not assume the previously-reported email issue is resolved without this test.
3. **ARCH-1 + CMS-9** (P1/P2, content + code) — finish the Services migration now that its noindex blocker is cleared.
4. **SEO-2, CTP-1, CMS-2, PERF-2** — batch the remaining P1s: one code PR (payload leak + blog preview) plus two independent quick actions (sitemap toggle, analytics).
5. **INFRA-1** at your own pace — a support-ticket follow-up, not blocking anything else.
6. **Everything else in P2** — dependency/security cleanup, Service ISR, dormant-layer decisions, form hardening, newsletter fix — schedule around your own priorities.
7. **Then P3 polish** — once content and indexing are correct, the UX/accessibility/maintainability refinements are worth the time.
8. **FUTURE items** stay backlogged until there's a specific reason to pull one forward.

**Bottom line: do not start improvements yet.** First complete SEO-1 (the P0) and the seven P1s above — every one of them finishes work this project already started, none of them are new scope. Everything in P2 and P3 is real and worth doing, but none of it is on fire.

---

*Read-only audit. No code changes, no commits, no WordPress changes, no plugin uploads were made while producing this report. Synthesized from independent source-code review, live HTTP/GraphQL/REST verification against both `www.tffdigital.com` and `cms.tffdigital.com`, a live browser pass, and local build/lint/audit runs — cross-checked across multiple independent research passes, with prior-round audit documents (see cleanup log) consolidated in and superseded by this file.*
