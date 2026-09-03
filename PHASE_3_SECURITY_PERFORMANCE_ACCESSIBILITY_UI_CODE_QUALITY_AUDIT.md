# PHASE 3 — FULL PRODUCTION SECURITY + PERFORMANCE + ACCESSIBILITY + UI/RESPONSIVE + CODE QUALITY AUDIT

**Audit Date:** 2026-09-02
**Scope:** Second-layer production audit — security, performance, accessibility, responsive UI, error handling/resilience, forms/leads, WordPress security boundary, dependencies, dead code, third-party services, production configuration, and an SEO regression sweep.
**Repository State:** `tff-digital @ main`, `0ff429c8b1bdfc254c31de6860c972f6f7ee4e91` — unchanged throughout (re-verified, §20).
**Prior work treated as closed unless a regression was found:** master/Phase-0 audit, Phase 1 (architecture/dependencies/code quality), Phase 2 (SEO/metadata/indexability), WordPress-driven Case Studies, Case Study Preview, Service View+Preview, Blog View, website-screenshot previews, CMS noindex, www canonicalization.
**Method:** Seven research passes (this orchestrating pass + six parallel sub-audits) combining direct source reading, real command execution (`npm run build`, `npm audit`, `npm outdated`), live read-only HTTP requests against `https://www.tffdigital.com`/`https://cms.tffdigital.com` (including live auth-failure tests against the preview endpoints), and one attempted browser-automation pass for responsive testing. Every claim is tagged VERIFIED (source or live), or explicitly **NOT VERIFIABLE FROM THIS ENVIRONMENT** where it genuinely couldn't be tested safely. Nothing was fixed, modified, installed, committed, or deployed.

---

## 1. EXECUTIVE SUMMARY

**No prior fix has regressed.** Every closed item this audit was told not to re-litigate — www canonicalization, CMS noindex, Case Study WordPress sourcing, View/Preview architecture for all three content types, website-preview cards, JSON-LD escaping, OG inheritance, robots.txt — was independently spot-checked live today and found unchanged. Two specifically-flagged historical risks were re-verified with fresh evidence and are now **structurally closed, not just currently-fine**: the testimonial hover-clipping fix is confirmed present in both code and live production, and `SelectedWork`'s `#work` anchor is now unconditionally rendered regardless of case-study data, so the previously-theoretical "anchor could vanish" risk is no longer possible even in principle.

**This phase's real contribution is 10 newly-discovered findings, none of them P0, one genuinely worth prioritizing (P2, security):**

1. **The case-study "Visit project" link renders a WordPress-editable URL as a raw `href` with zero scheme validation** — the same `projectUrl` field that correctly gets http/https-only validation for the homepage's screenshot feature has no equivalent guard on this second, independent consumer. A compromised WordPress admin account (a precondition the master audit already flags as real, unaddressed risk via SEC-2/CMS-3) could set a `javascript:` URI here. **P2, Claude-fixable.**
2. **`generateMetadata()` and the page body independently re-fetch the same WordPress content** on all three dynamic detail-route types — a real code-level duplicate-call pattern, with an honest open question about whether Next's fetch memoization actually dedupes it server-side (these are POST requests to WPGraphQL, not the GET case memoization is best-documented for). **P2, Claude-fixable.**
3. **The "double-priority images" issue the brief referenced still exists**, freshly located: the Navbar logo is marked `priority` unconditionally on every single page, stacking with each page's own priority hero/card image. Low severity (the logo is far too small to be the actual LCP element) but real and easy to fix. **P3.**
4. **The mobile navigation menu has no focus trap** — a keyboard user can tab focus out of the visually-open menu while body scroll stays locked. **P2, real, sitewide.**
5. **Sitewide entrance animations don't respect `prefers-reduced-motion`** outside the two carousel components, which do it correctly. AAA-level, not an AA blocker, but genuinely sitewide. **P2 for breadth, not severity.**

**Zero regressions found in the WordPress security boundary** — every master-audit SEC-*/CMS-* item was independently re-verified live today, all closed and unchanged, with the SEC-6 email-header-injection reasoning re-confirmed directly from the plugin's actual source code this pass (not just cited from a prior document).

**The contact-form lead pipeline remains PARTIALLY WORKING**, unchanged from the master audit: the WordPress-save path is sound and re-verified end-to-end at the code level, but whether the confirmation/notification emails actually deliver in production **remains genuinely unprovable without a real test submission** — this audit correctly did not perform one. Both newsletter forms are confirmed, again, to be non-functional UI stubs.

**Dependencies and dead code show zero drift from Phase 1** — identical `npm audit`/`npm outdated` output, every previously-identified dormant architecture layer re-confirmed at zero consumers, and the wider search this phase specifically asked for (unused utilities, mock files, unused type exports, unused npm packages) came back clean.

**Scorecard (this phase, new findings only):** 0 P0 · 0 P1 · 3 P2 · 6 P3 · 1 INFO. Combined with everything still open from prior phases, see §13 for the full cumulative punch list.

---

## 2. SECURITY AUDIT

**PASS — with findings.** No critical or exploitable-today vulnerability found. Core security architecture (headers, CSP, preview auth, WordPress boundary) is sound and re-verified live. One real, previously-undocumented input-validation gap found (below), consequential only under a precondition (WordPress admin compromise) that two other already-known, already-open findings (SEC-2, CMS-3) also depend on.

### A1 — HTTP Security Headers

Live production headers confirmed an **exact match** to `next.config.ts`'s `headers()` function, enforcing mode (not report-only): CSP, `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (camera/mic/geo/interest-cohort all blocked). `Strict-Transport-Security: max-age=63072000` confirmed live, added by Vercel's platform layer. `frame-ancestors 'self'` correctly lives inside the CSP (the modern-correct location) with `X-Frame-Options` also set for older-browser defense-in-depth — not a finding, a good pattern.

**Genuinely missing, assessed on merit rather than recommended blindly:**
- **Cross-Origin-Opener-Policy** — absent. Real benefit here is low (no cross-origin popup/auth flows exist on this site); compatibility risk of adding `same-origin` is also low. **P3, optional, Claude can fix.**
- **Cross-Origin-Resource-Policy** — absent. Low value for a public marketing site with no sensitive per-resource data. **P3, optional.**
- **X-XSS-Protection** — absent, and **correctly so**: deprecated, ignored by modern browsers in favor of CSP, historically could itself introduce bugs. **Category: Working as designed — not a finding.**

`Cache-Control` on the 3 preview routes is `public, max-age=0, must-revalidate` rather than `private, no-store` — functionally safe (confirmed no actual caching occurs, `x-vercel-cache: MISS` on repeat identical requests) but imprecise hygiene, especially on auth-failure responses. **P3, Claude can fix.**

### A2 — XSS

Fresh repo-wide grep reconfirms **exactly 2** `dangerouslySetInnerHTML` usages, unchanged from Phase 1/2: `JsonLd.tsx` (verified safe, escaping re-confirmed) and `ArticleContent.tsx` (Phase 1's **ARCH-5**, deliberate documented trust boundary, not re-derived here). No ACF plugin in use; no unaudited custom-field surface found beyond the standard CPT fields already covered by existing adapters.

#### SEC3-1 — Unvalidated, scheme-unchecked WordPress URL rendered as a live `href`
- **Category:** Security / XSS. **Priority: P2.**
- **What/Where:** `src/app/case-studies/[slug]/page.tsx:144` — the "Visit project" link uses `next/link`'s `Link` with `href={caseStudy.projectUrl}`, a free-text WordPress field (`case-study.adapter.ts:40`) with **zero scheme validation** at this call site.
- **Why it matters:** This is the *identical* WordPress-editable field that feeds the homepage's mshots screenshot pipeline (`src/lib/content/website-preview.ts`), which correctly restricts to `http`/`https` only via `isPreviewableProjectUrl()` (read in full, confirmed thorough — blocks localhost/loopback/private IPv4+IPv6/link-local). This second, independent consumer of the same field has no equivalent guard. If a WordPress case-study editor — or a compromised admin account, the same precondition class SEC-2/CMS-3 already document as open — sets Project URL to a `javascript:` URI, any visitor clicking "Visit project" executes it in the site's own origin.
- **Caveat, stated honestly:** whether this site's CSP (`script-src 'self' 'unsafe-inline'`) would provide a reliable secondary backstop against `javascript:`-URL execution on click was **not fully verifiable from this environment** across browsers — treat the missing input validation as the standalone finding regardless.
- **Recommendation:** Apply the same or an equivalent http/https-only check before rendering the href (reuse `isPreviewableProjectUrl` or a lighter dedicated check); don't render the link at all if invalid, mirroring the mshots pathway's existing null-fallback pattern.
- **Claude Can Fix: YES. Manual/User Needed: NO.**

No other WordPress-editable free-text field was found rendered as a raw `href`/`src` without going through slug-based internal routing or React's default text-escaping.

### A3 — SSRF / URL Input

`website-preview.ts`'s SSRF guard re-read in full and reconfirmed thorough and unchanged: blocks localhost/`0.0.0.0`/`::1`, all standard private IPv4 ranges, `169.254.0.0/16` link-local, IPv6 unique-local and link-local ranges; restricts to http/https by construction. **Reconfirmed unchanged, working as designed.**

Noted limitation, not a new actionable finding: validation is string-based against the literal hostname, not resolved IPs, so a DNS-rebinding hostname would technically bypass it — but this app's own server **never fetches the target itself**, it only builds an `<img src>` pointing at `s.wordpress.com`; the actual fetch happens entirely on WordPress.com's infrastructure. A DNS-rebinding bypass would be a WordPress.com concern, not this app's. Matches master audit's own scoping exactly.

`next/image`'s `remotePatterns` allowlist (WordPress media, `placehold.co`, `secure.gravatar.com`, `s.wordpress.com`) reconfirmed tight and complete, no gap. The one other CMS-URL-triggers-request path is **SEC3-1** above (a client-click navigation, not a server-side/automatic fetch — correctly classified as XSS, not SSRF).

### A4 — Preview Security

`case-study/route.ts`, `service/route.ts`, `disable/route.ts`, `preview-auth.ts`, `preview-request.ts`, `preview.config.ts` all re-read in full; live tests re-run (missing secret, wrong secret, malformed id, `?preview=true` with no cookie) against real production URLs.

**Reconfirmed exactly, unchanged, via fresh code read and fresh live tests (not citation):** constant-time secret comparison (length-check short-circuit + `timingSafeEqual`); secret never a `NEXT_PUBLIC_*` var; WordPress Application Password `server-only`-guarded; generic non-fingerprinting 401s on both missing and wrong secrets, identical body; `?preview=true` alone renders the ordinary published page — cosmetic only, the httpOnly Draft Mode cookie is the real gate; open-redirect risk confirmed **none** (the redirect target is built exclusively from the server-fetched, authenticated slug, never from request input).

**New observations this pass (not previously documented at this level of detail):**
- **Draft Mode cookie flags, live-captured:** `Secure; HttpOnly; SameSite=None`. HttpOnly+Secure correct; `SameSite=None` is Next.js's own Draft Mode implementation choice (not app-controlled), reasonable given the cookie must survive a cross-site top-level navigation from WordPress's own Preview button. Low practical risk since no mutating action is gated by this cookie. **P3/INFO, Claude cannot fix — framework behavior.**
- **Replay risk, named explicitly:** a leaked preview secret + valid post id lets a third party retrieve real draft content indefinitely (no expiry/rotation). Standard, reasonable design for this class of feature, not a code defect. **P3/INFO.** Mitigation if ever suspected leaked: rotate `WORDPRESS_PREVIEW_SECRET` in both Vercel and `wp-config.php` — **Manual/User Needed: Vercel + WordPress.**
- **Status validation for trashed/pending posts:** the routes correctly delegate authorization entirely to WordPress's own authenticated `asPreview` resolver rather than reimplementing it — reasonable design, but whether that resolver would still serve a *trashed* post given a valid id is genuinely untested. **NOT VERIFIABLE FROM THIS ENVIRONMENT** (would require creating and trashing a real WordPress test post, outside safe/read-only scope).

### A5 — API Routes

Exactly 3 routes confirmed under `src/app/api` (fresh enumeration, matches baseline) — no `/api/contact`/`/api/leads` route exists (contact form uses a Server Action).

| Route | Methods | Auth | Rate Limiting | CORS | Cache-Control |
|---|---|---|---|---|---|
| `/api/preview/case-study` | GET only (POST→405 live-tested) | Preview secret, constant-time | None | No `Access-Control-Allow-Origin` (same-origin only for JS fetch; correct-by-design since real usage is a top-level navigation, unaffected by CORS) | `public, max-age=0, must-revalidate` (see A1) |
| `/api/preview/service` | Same | Same | None | Same | Same |
| `/api/preview/disable` | GET only | **None** | None | Same | Not independently re-checked |

#### API-1 — Imprecise Cache-Control on preview routes
- Same finding as A1's Cache-Control note above. **P3, Claude can fix.**

#### API-2 — `/api/preview/disable` has no auth check
- **Category:** Working as designed, not a vulnerability. **Priority: INFO.**
- **Why:** This endpoint only clears the *caller's own* Draft Mode cookie — an anti-capability, not a privilege. It cannot disable preview for anyone else or leak anything. Documenting for completeness since the audit asked for an auth-status determination on every route, not because it needs fixing.

### A6 — Contact/Lead Form Security

Full trace performed under §6 (Forms/Leads Audit) below — not duplicated here. Summary: field-contract agreement across all 3 layers re-confirmed exact; Zod enforced both client and server; genuine Server Action (inherent CSRF protection via Next's same-origin enforcement, confirmed this really is a Server Action not a hand-rolled route); email/HTML injection re-verified **directly from the WordPress plugin's actual source this pass** — `sanitize_text_field`/`sanitize_email` strip CR/LF before the `Reply-To` header string-concatenation ever runs, confirming master audit SEC-6's "not exploitable today" verdict from source, not citation.

### A7 — WordPress Security Boundary

**Every master-audit §5/§8 item independently re-verified live today, 2026-09-02 — all CLOSED, zero regressions:**

| Item | Live re-check today | Status |
|---|---|---|
| GraphQL introspection | Still disabled for public requests | CLOSED |
| `/wp-json/wp/v2/users` enumerates "admin" | Confirmed, identical | CLOSED (known, low-severity, unchanged) |
| `/wp-json/wp/v2/plugins` requires auth | Confirmed, 401 | CLOSED |
| XML-RPC `system.listMethods`/`pingback.ping`/`system.multicall` | Still live | CLOSED (known, low-severity, unchanged) |
| REST namespace list | Byte-identical to master audit's list, no new custom routes | CLOSED |
| `headless/v1/leads` endpoint | GET→404, OPTIONS→field-schema only | CLOSED |
| CMS-wide noindex (`X-Robots-Tag`) | Active on homepage/`/graphql`/`/wp-json/` today | CLOSED |
| `readme.html` reachable | 200, INFO-level fingerprinting only | CLOSED |
| Application Password server-only | Cited from Phase 1's exhaustive env-var sweep, not redone | CLOSED |

Plugin source (`wordpress-plugin/tff-headless-leads/tff-headless-leads.php`, 607 lines) re-read in full: `permission_callback: '__return_true'` on the leads endpoint is **deliberate** — public by design, with protection coming from per-field validation/sanitization (length-capped `validate_callback`, `sanitize_text_field`/`sanitize_email`/`sanitize_textarea_field`) enforced by WordPress *before* the handler runs, not from auth. `tff_lead` CPT confirmed `public => false, show_in_rest => false`. No rate limiting anywhere in this file — confirms FORM-2, not re-flagged as new.

---

## 3. PERFORMANCE AUDIT

**PASS — with findings.** Architecture is sound (correct ISR usage where wired, zero unnecessary Client Components, tight image allowlist, lean font/icon-library handling). Two new, real, low-to-medium severity findings; one already-known finding (PERF-1) now quantified with live timing evidence.

### B1 — Next.js Architecture

Fresh `npm run build` route table (2026-09-02):

| Route | Mode | First Load JS | Revalidate |
|---|---|---|---|
| `/` | Static | 285kB | 1m |
| `/about` | Static | 191kB | — |
| `/blog` | Dynamic | 142kB | — |
| `/blog/[slug]` | SSG | 143kB | 1m |
| `/blog/category\|tag/[slug]` | Dynamic | 141kB | — |
| `/case-studies` | Dynamic | 141kB | — |
| `/case-studies/[slug]` | SSG | 185kB | 1m |
| `/contact` | Static | 266kB | — |
| `/services` | Static (hardcoded, ARCH-1) | 271kB | — |
| `/services/[slug]` | **Dynamic, no revalidate** | 266kB | — |
| `/services/seo`, `/services/smm` | Static | 268kB | — |

`/services/[slug]` still fully dynamic with no ISR — reconfirms **PERF-1**, unchanged, now quantified below.

#### PERF-4 — Duplicate WordPress fetch between `generateMetadata()` and the page body
- **Category:** Performance / Code Quality. **Priority: P2.**
- **What:** On all three WordPress-backed dynamic detail routes, `generateMetadata()` and the page body component independently call the identical `getXBySlug(slug)` service function — confirmed by full read of `services/[slug]/page.tsx` (called separately at both the metadata and body call sites) and the same architecture pattern in `blog/[slug]` and `case-studies/[slug]`.
- **Honest caveat:** whether this actually costs a second real WordPress round-trip is **NOT VERIFIABLE FROM THIS ENVIRONMENT** — Next's automatic fetch Request Memoization is best-documented for GET requests, and these are `method: "POST"` calls to WPGraphQL, so guaranteed dedup can't be assumed without empirical confirmation.
- **Recommendation:** Fetch once in the page component and pass the result into a metadata-building step, or empirically confirm Next's memoization actually dedupes these specific POST calls before deciding it's a non-issue.
- **Claude Can Fix: YES. Manual/User Needed: NO.**

`fetchGraphQL`'s default `revalidate: 60` and `postToWordPress`'s correct no-cache-option-for-POST behavior both reconfirmed sound, not findings.

### B2 — Waterfalls

`blog/[slug]/page.tsx` body correctly parallelizes independent fetches via `Promise.all` — good pattern, not a finding. No sequential-when-could-be-parallel pattern found elsewhere in the routes read. No client-side WordPress fetching found anywhere (Phase 1 already confirmed zero "use client" files import the WordPress lib layer directly; no drift possible since HEAD is frozen).

### B3 — Images

Zero raw `<img>` tags anywhere in `src` — everything routes through `next/image`. `remotePatterns` complete, no gaps, no unused entries.

#### PERF-5 — Two simultaneously priority-marked images per page ("double-priority")
- **Category:** Performance. **Priority: P3.**
- **What:** `Navbar.tsx:45` renders the `Logo` with `priority` **unconditionally on every page**. Every content-detail/listing route that also marks its own hero/featured image `priority` (blog detail, case-study detail, service detail, case-studies listing's first card, blog category/tag listing's first card) therefore ships two simultaneously high-fetch-priority images, not one.
- **Impact:** Low — the logo is small (~32-36px tall) and very unlikely to be the actual LCP element — but it dilutes the browser's preload-priority signal at the most bandwidth-contested moment of page load. Notably, `FeaturedPost.tsx`/`BlogResults.tsx` correctly coordinate with each other to avoid a double-*large*-image conflict on `/blog` — the Logo is the one image not accounted for in that coordination anywhere.
- **Recommendation:** Drop `priority` from the Navbar `Logo`, or make it conditional on route.
- **Claude Can Fix: YES. Manual/User Needed: NO.**

### B4 — JavaScript Bundle

No Swiper/carousel library and no chart library exist in this project (stated plainly, not assumed). `optimizePackageImports` covers `lucide-react`/`framer-motion`. `highlight.js` is used leanly — `lib/core` plus 12 individually-registered languages, not the full bundle.

#### PERF-6 — `highlight.js` CSS imported unconditionally regardless of content
- **Category:** Performance. **Priority: P3.**
- **What:** `ArticleContent.tsx` (used on all 3 detail-page types) unconditionally imports `highlight.js/styles/github-dark-dimmed.css` at module scope, regardless of whether the specific WordPress content actually contains a code block.
- **Recommendation:** Conditionally import only when the rendered HTML contains a `<pre><code>` block.
- **Claude Can Fix: YES. Manual/User Needed: NO.**

Bundle sizes (fresh build) confirm master audit's prior 140-285kB characterization, Contact/Services heaviest — unchanged, not new.

### B5 — Core Web Vitals

**Real measured evidence this pass** (live `curl -w` timing, 2026-09-02):

| Route | TTFB | Total | Cache |
|---|---|---|---|
| `/` (ISR, cached) | 0.137–0.376s | 0.20–0.44s | `HIT` |
| `/case-studies/[slug]` (SSG/ISR) | 0.432s | 0.466s | — |
| `/services/[slug]` (dynamic, no ISR) | 0.589s | 0.812s | `MISS`, `private, no-cache` |

This **quantifies PERF-1 with fresh live numbers**: the non-ISR service route costs roughly 2-4x the wall-clock time of the cached/ISR routes on every single visit, not just cache-miss moments.

**LCP, FCP, CLS, INP: NOT VERIFIABLE FROM THIS ENVIRONMENT.** No Lighthouse/PageSpeed/RUM access exists here — not fabricated. Master audit's own prior CLS:0 (real `PerformanceObserver` measurement) is the only genuine historical data point, not re-measured this pass, treated as unconfirmed-but-not-contradicted.

---

## 4. ACCESSIBILITY AUDIT

**PASS — with findings.** Strong foundational patterns confirmed (skip link, landmark structure, focus-visible discipline, a genuinely well-built accessible carousel component). Two new, real gaps found — one sitewide-breadth reduced-motion gap and one real keyboard-trap gap in the mobile menu.

**Required specific re-verifications — both CLOSED with fresh evidence:**

- **Testimonial hover-clipping fix (commit `c80965a`) — CONFIRMED FIXED, code + live production.** `TestimonialSlider.tsx:249-259` uses an explicit `-my-8`/`py-8`/`[contain:paint]` technique with a comment explaining why. Live-verified via hover + screenshot on production: clean lift/glow, zero clipping.
- **`/#work` anchor + `SelectedWork` conditional rendering — CONFIRMED structurally safe, not just currently-fine.** `SelectedWork.tsx:23-27` — `<section id="work">` now renders **unconditionally**; only the *inner content* swaps between an `EmptyState` and the case-study grid based on data. Code comment confirms this was a deliberate fix: "Keeps `id="work"` alive even with zero featured case studies." Live-confirmed `/#work` scrolls correctly today. This is no longer even a latent risk — the anchor's existence is now structurally independent of WordPress content.

**Reconfirmed working-as-designed / closed (not new):** skip-to-main-content link present and correctly targeted; clean heading hierarchy and landmark structure sampled across routes; Contact form's `Input` component correctly wires `aria-invalid`/`aria-describedby`; 23 of 24 `outline-none` usages sitewide correctly paired with a `focus-visible:ring` replacement (the 1 exception is the skip-link's own legitimate `tabIndex={-1}` target, not a gap); WordPress image alt text correctly sourced from the real `altText` field with empty-string (not placeholder-word) fallback; `TestimonialSlider` is a genuinely well-built accessible carousel — `role="region"`, per-slide `aria-label`, keyboard arrow-navigation, `inert` on off-screen slides, autoplay pauses on hover/focus *and* respects `useReducedMotion()`. **A11Y-3** (master audit, CTA gradient button ~3.69:1 contrast) reconfirmed unchanged — design tokens byte-identical to when it was measured, not regressed, still open.

**Reconfirmed still-open, unchanged (not new):** **UX-2** (mobile hamburger button has `aria-label` but no `aria-expanded`/`aria-controls`) and **UX-5** (no Escape-key handler on the mobile menu) both re-verified against current `Navbar.tsx`, unchanged.

#### A11Y-4 — Mobile navigation has no focus trap when open
- **Category:** Accessibility. **Priority: P2.**
- **What:** No `role="dialog"`, no focus moved into the panel on open, no focus restored on close. A keyboard user tabbing through the page can move focus outside the visually-open menu while body scroll stays locked.
- **Impact:** Real, affects keyboard-only users specifically, on every page (the mobile nav pattern is used sitewide).
- **Recommendation:** Add focus trapping (move focus into the panel on open, restore to the trigger on close, constrain Tab within the panel while open).
- **Claude Can Fix: YES. Manual/User Needed: NO.**

#### A11Y-5 — Sitewide entrance animations don't respect `prefers-reduced-motion`
- **Category:** Accessibility. **Priority: P2** (flagged for breadth, not severity — this is WCAG 2.3.3, AAA-level, not an AA blocker).
- **What:** `src/styles/animations.ts`'s shared `fadeInUp`/`fadeIn`/`hoverLift` presets (spread across Hero, SelectedWork, and most other sections) have zero reduced-motion branching. Only `TestimonialSlider.tsx` and `TeamCarousel.tsx` individually call `useReducedMotion()`.
- **Recommendation:** Wrap the shared animation presets to branch on a shared reduced-motion check, matching the pattern the two carousels already use correctly.
- **Claude Can Fix: YES. Manual/User Needed: NO.**

**Coverage note, stated honestly:** Navbar, SelectedWork, TestimonialSlider, and the Contact form's `Input` component got deep code+live review this pass. Footer, Case Study cards, Service cards, and Blog cards were **not** independently deep-audited beyond what the master audit already documented — their prior status is carried forward, not freshly reconfirmed. **A11Y-1** and **A11Y-2** (master audit: case-study stat grouping, footer newsletter label) were **not re-verified this pass** — carried forward as-is, neither claimed fixed nor reconfirmed broken.

---

## 5. UI / RESPONSIVE AUDIT

**PASS for everything genuinely testable this pass; breakpoint-specific claims NOT VERIFIABLE.**

**Tooling constraint reconfirmed present today**, matching the master audit's own prior finding: a live test (2 independent resize attempts, checked via `window.innerWidth`/`visualViewport.width`) confirmed the viewport-resize tool still does not change the actual rendered viewport in this environment — it stayed pinned at host-native resolution (~2560px) regardless of requested size. **True rendered-pixel claims at the requested breakpoints (320/375/390/430/768/1024/1280/1440/1920) are NOT VERIFIABLE FROM THIS ENVIRONMENT.** This is reported honestly rather than fabricated, exactly matching the master audit's own precedent — and has already been reported as a product-tooling issue.

**Code-level responsive pattern spot-check performed instead** (Tailwind-class inference, not visual proof): `SelectedWork`'s grid (1 column below 640px, 2 above) and `TestimonialSlider`'s deliberately mobile-first slide-width scaling both look intentionally designed, no obvious overflow risk. **Worth knowing:** the Navbar switches from horizontal nav to hamburger at `xl:` (1280px), not a smaller breakpoint — a design choice that puts most tablets and some small laptops (768px–1279px) into the mobile-nav pattern too, not just phones. Not a bug, just wider-than-typical.

**Desktop (~2560px, the only viewport this environment could actually render) — live-verified:** no horizontal overflow or clipped content observed on homepage sections screenshotted.

**UX-1, UX-3, UX-4, UX-6** (master audit — form `aria-required`, dead-end service cards, testimonial heading copy, footer link consistency) were **not re-checked this pass** — carried forward from the master audit as-is.

---

## 6. FORMS / LEADS AUDIT

Full pipeline re-trace performed fresh (2026-09-02), every file in the chain read in full. **No real lead was submitted** (would create real WordPress data + send real email — correctly avoided, matching the master audit's own constraint).

**Pipeline confirmed unchanged, field contract still exact** across Zod schema / TS type / live WordPress REST arg schema (re-confirmed via a fresh live `OPTIONS` request to the leads endpoint).

**Email notification path: still `NOT VERIFIABLE FROM THIS ENVIRONMENT` — do not read this as "fixed."** The `Promise.allSettled` decoupling (WordPress-save success independent of email success) is confirmed unchanged. `.env.local`'s Resend keys are still shape-checked placeholder strings (no value printed). **Cannot prove the email path works without a real submission**, which this audit correctly does not perform. This remains open exactly as the master audit's **FORM-1** describes it — **owner: user must confirm Vercel Production env values and `wp-config.php`'s storage constant, then run one real test submission.**

**Validation/spam/CSRF/rate-limiting, all reconfirmed unchanged:** Zod enforced client and server; no honeypot/CAPTCHA/rate-limit anywhere in either layer (**FORM-2**, unchanged); submit button correctly disabled during submission; genuine Server Action confirmed (inherent CSRF protection via Next's same-origin enforcement, not a hand-rolled route needing its own handling).

**Email/HTML injection — re-verified this pass directly from the WordPress plugin's actual source, not cited:** `sanitize_text_field`/`sanitize_email` are applied via the REST arg schema's registered `sanitize_callback`, which WordPress runs automatically inside `get_param()` — confirmed the `Reply-To` header's string concatenation only ever receives already-CR/LF-stripped values. **SEC-6's "not exploitable today" verdict reconfirmed from source.** Admin-facing email templates correctly wrap every field in `esc_html()`/`esc_url()`.

**PII/error leakage:** no direct PII echo found in any log statement; all 4 catch-branches in `actions.ts` return hand-written generic messages, zero stack traces or internal detail ever reach the client. Timeout: same 8-second `AbortSignal.timeout` pattern as every other WordPress fetch, unchanged. Retry: **none found** — a failed submission requires manual resubmission (form isn't cleared on failure, so this is low-friction, but there's no automatic retry).

**Newsletter forms — reconfirmed, still pure UI stubs.** Both `Footer.tsx`'s `onSubscribe` and `NewsletterSection.tsx`'s `onSubmit` are local-state-only, zero network call, zero storage, zero email captured. `NewsletterSection.tsx` carries an explicit code comment confirming this is deliberate, pending a real backend (**FORM-3**, unchanged).

### Classification

| | Contact Form | Newsletter (Footer + Blog) |
|---|---|---|
| UI exists? | Yes | Yes |
| Backend exists? | Yes (Server Action → WP REST) | **No** |
| Validation exists? | Yes, both layers | Client-only (`required` attr) |
| Storage exists? | Yes (WordPress) | **No** |
| Email exists? | Code fully implemented; **live delivery unproven** | **No** |
| Success/Error state? | Yes, both, generic + safe | Yes (fake success only) |
| Spam/Rate limiting? | No / No | N/A |
| **Classification** | **PARTIALLY WORKING** | **UI STUB** |

**New findings this pass:** no server-side duplicate-lead detection beyond the client button-disable (**FORM-4**, P3, Claude can fix); no retry on transient failure (**FORM-5**, P3, Claude can fix).

---

## 7. WORDPRESS / HEADLESS SECURITY AUDIT

See §2's A7 above for the full re-verification table — **every master-audit WordPress-security item is CLOSED, zero regressions**, independently re-checked live today rather than assumed. No new findings in this specific section beyond API-1/API-2 (§2, A5) and SEC3-1 (§2, A2), which are cross-referenced there rather than duplicated here.

---

## 8. DEPENDENCY AUDIT

**Zero drift from Phase 1.** Fresh `npm audit`: identical 4 HIGH / 0 CRITICAL, same 3 packages (`nanoid`, `postcss`, `sharp`), same advisory IDs, same fix paths. Fresh `npm outdated`: identical shape — `next` 1 major behind, `typescript` 2 majors behind, `eslint`/`framer-motion`/`@types/node` each 1 major behind, everything else minor/patch only. **DEP-1, DEP-2, DEP-3 all CLOSED/unchanged**, re-confirmed with fresh command output, not copied forward blindly.

**New coverage this phase specifically asked for — all clean:**
- **No unused npm dependencies.** All 13 production `dependencies` confirmed actually imported somewhere in `src/` (including two initially-missed subpath imports — `highlight.js` and `server-only` — corrected on a second grep pass).
- **Mock-data layer genuinely wired, not dead code.** Every file under `src/lib/mock/` is imported by its corresponding `*.service.ts`, gated on `WORDPRESS_USE_MOCK_DATA` (**ARCH-3**). A nuance worth noting, not a new defect: `navigation.mock.ts` and `portfolio-items.mock.ts` are technically "referenced" only by services that are themselves part of the already-tracked dormant **ARCH-2**/**ARCH-4** layers — real-world reachability is zero, same as their parent service, but this isn't a separate dead-code item, just an extension of the existing classification.
- Domain types scoped to the dormant layers, `case-study-placeholders.ts` (still actively used, defensive code correctly left in place), `lead.ts`, `utils.ts` — all checked on suspicion, all genuinely used or correctly-scoped. **No new dead code found.**

---

## 9. DEAD CODE / ARCHITECTURE AUDIT

All of Phase 1's dormant-architecture findings re-confirmed at zero consumers via fresh grep, zero regressions:

| ID | Re-check | Status |
|---|---|---|
| ARCH-2 (dormant Portfolio layer) | `grep` → 0 hits | CLOSED |
| ARCH-4 (dormant navigation layer) | `grep` → 0 hits | CLOSED |
| Dormant WordPress Pages layer | `grep` → 0 hits | CLOSED |
| ARCH-9 (3 zero-consumer components) | All 3 still 0 consumers | CLOSED |
| 7 `TODO: RESTORE WORDPRESS DATA` markers | Still exactly 7 | CLOSED |

No new dead code found beyond what §8/§9's combined fresh search covered above. **No deletion recommended for anything** — every dormant item remains either intentionally-dormant (Portfolio/navigation, pending a product decision) or genuinely future-ready (the 2 skeleton-loader components), per this audit's own instruction not to recommend deletion merely for having zero current consumers.

---

## 10. ERROR / RESILIENCE AUDIT

**Root error boundaries read in full this pass, both sound:**
- `src/app/error.tsx` — route-level error boundary. Logs via `console.error` (server-side only), shows a generic "Something went wrong" message with "Try again"/"Back to home" actions, zero stack trace or internal detail exposed to the user. **Working as designed.**
- `src/app/global-error.tsx` — root-layout-level fallback, deliberately self-contained (inline styles, no design-system imports) since it fires when the layout itself throws and can't depend on anything the layout would normally provide — a genuinely well-reasoned defensive pattern, explicitly commented as such. **Working as designed.**

**CMS outage/timeout/malformed-response handling:** not re-derived this pass — the master audit already verified this deeply (8-second `AbortSignal.timeout` on every WordPress fetch, a typed `WordPressError` with a `kind` discriminant, and a deliberate strict/soft split where primary content fails loud into the route's error boundary while secondary surfaces fail soft into an empty result). Phase 1's **CQ-1** (Zod not applied at the WordPress response boundary) is directly relevant here and not re-litigated: a genuinely malformed (not just absent) WordPress response wouldn't necessarily produce the same clean typed error every other failure mode gets — it could propagate `undefined` into a component or throw an unrelated `TypeError`. This remains an open, tracked robustness gap, not a new finding.

**Invalid slug / deleted content:** Phase 2 already live-tested 404 behavior for all three content types today (`/services/[bad-slug]`, `/case-studies/[bad-slug]`, `/blog/[bad-slug]`) — all correctly 404, all correctly noindex; the one known inconsistency (blog 404's generic title vs. the other two types' "Page not found" title, **SEO-5**) is already tracked, not re-derived here.

**Email/lead-creation failure:** covered fully in §6 above.

**External image failure (mshots screenshot):** noted in Phase 3's third-party inventory (§11) — no app-level fallback UI confirmed beyond `next/image`'s normal broken-image handling if WordPress.com's mshots service is ever down; low-severity, cosmetic-only degradation for a non-essential visual enhancement.

**CMS 500/malformed-response simulation against live production:** **NOT VERIFIABLE FROM THIS ENVIRONMENT** — safely simulating an actual CMS outage against the real production WordPress instance is outside this audit's read-only scope; the code-level resilience pattern (8s timeout, typed errors, strict/soft split) is verified by source, not by inducing a real outage.

---

## 11. PRODUCTION CONFIGURATION AUDIT

Cited from Phase 1's exhaustive, unchanged (HEAD frozen) environment-variable sweep rather than redone: all 12 `process.env.*` references match `.env.example` exactly, both directions — zero undocumented vars, zero unused documented vars. Only 2 `NEXT_PUBLIC_*` variables exist, both non-sensitive. Zero server-only env var found referenced in any `"use client"` file — no leak. **CQ-2** (3 of 4 server-only config files missing an `import "server-only"` guard — no active leak, just a missing fail-fast backstop) remains open, unchanged, not re-derived here.

**This phase's forks independently re-confirmed the security-relevant subset live:** preview secret never `NEXT_PUBLIC_*` (re-tested), WordPress Application Password never reachable from any client-side code path (cited, consistent with the fresh client/server-boundary checks other forks performed this phase).

Third-party service inventory (Section I of the brief), consolidated:

| Service | Origin | Essential? |
|---|---|---|
| WordPress (Bluehost) + WPGraphQL | Server-side | Yes — core CMS |
| Yoast SEO | Server-side (via GraphQL) | Yes, for current SEO architecture |
| Vercel | Platform | Yes — hosting |
| Resend | Server-side only, key confirmed `server-only`-guarded | Yes, for the email feature specifically |
| WordPress.com mshots | Browser-side `<img>` only; this app's server never fetches the target | No — cosmetic, degrades gracefully |
| Google Fonts | **Build-time only** — self-hosted via `next/font`, zero runtime request, consistent with CSP's `font-src 'self'` | Yes, zero ongoing third-party dependency |
| Google Maps embed | Browser-side, confirmed actually in use on the Contact page | No — could be a static image/link, low cost as-is |
| YouTube (oEmbed) | CSP-provisioned for WP-editor-pasted embeds; **not confirmed whether the current live blog post actually uses this** | No — provisioned capability, zero confirmed current usage |
| Analytics (any provider) | — | **None found anywhere** — reconfirms **PERF-2**, unchanged |
| Gravatar | Browser-side, proxied through `next/image` | No — cosmetic avatar fallback |

**No third-party host found in code that's absent from the CSP/`remotePatterns` allowlist** — full consistency confirmed, no CSP gap.

---

## 12. SEO REGRESSION CHECK

Not a Phase 2 re-audit — a pass/fail sweep only, per this phase's own instruction. Phase 2's findings are from earlier today, in this same session; nothing has changed since (HEAD frozen, and this phase's forks independently re-confirmed the WordPress/CMS-side facts live again).

| Item | Result |
|---|---|
| Canonical www consistency | **PASS** |
| Sitemap | **PASS** — with the already-tracked, non-regression gaps (Services listing entries, blog category/tag pages — **SITEMAP-1**) |
| Robots.txt | **PASS** |
| Noindex CMS protection | **PASS** — re-confirmed live again this phase (§2, A7) |
| Case Study View | **PASS** |
| Case Study Preview | **PASS** — live-retested with fresh auth-failure tests this phase (§2, A4) |
| Service View | **PASS** |
| Service Preview | **PASS** — live-retested this phase |
| Blog View | **PASS** |
| Production indexability (SEO-1, the P0) | **STILL OPEN, unchanged — not a regression, a pre-existing tracked item.** All 10 real WordPress content pages remain noindexed live. This is a WordPress/Yoast setting, not a code defect, and was never "working" to begin with, so it isn't subject to regression — it's simply still waiting on the wp-admin fix Phase 2 already specified. |

**REGRESSION CHECK — PASS** (for everything that was previously working; SEO-1 remains the one pre-existing, already-tracked exception, not newly discovered here).

---

## 13. MASTER PRIORITY TABLE

Cumulative, actionable, open items across all phases — not just this phase's new findings. Closed/working items are in §17, not repeated here.

| ID | Category | Finding | Evidence | Production Impact | Priority | Claude Can Fix? | Manual/User Needed? | Recommendation |
|---|---|---|---|---|---|---|---|---|
| SEO-1 | SEO | 10 real WP pages noindexed live, sitemap lists 3 | Live meta + GraphQL, re-confirmed today | Zero search visibility for all real content | **P0** | NO | WordPress/Yoast | Toggle Yoast indexability |
| SEO-2 | SEO/Code | Homepage JSON-LD hydration leaks `cms.tffdigital.com` URLs | `SelectedWork.tsx` unused `seo` prop | Internal hostname visible in page source | **P1** | YES | — | Narrow prop type |
| FORM-1 | Forms | Email delivery unverified end-to-end | Placeholder local keys, code-level trace | Business-critical: may be silently failing | **P1** | NO | Vercel + WordPress + real test | Confirm env values, run one real test lead |
| SEC3-1 | Security/XSS | `projectUrl` rendered as raw href, no scheme validation | `case-studies/[slug]/page.tsx:144` | Requires WP-admin compromise first; then site-origin script execution | **P2** | YES | — | Add http/https-only check before rendering |
| PERF-4 | Performance | `generateMetadata`+body duplicate WP fetch | 3 dynamic route types | Possible extra CMS round-trip per request (unconfirmed magnitude) | **P2** | YES | — | Fetch once, share result |
| A11Y-4 | Accessibility | Mobile nav has no focus trap | `Navbar.tsx` | Real, keyboard users, sitewide | **P2** | YES | — | Add focus trapping |
| A11Y-5 | Accessibility | Sitewide animations ignore reduced-motion | `animations.ts` | AAA-level, broad | **P2** | YES | — | Branch shared presets on reduced-motion |
| ARCH-1 | Architecture | Services listing/homepage hardcoded | `temporary-services.ts` | Real WP content undiscoverable | P2 | PARTIAL | WP content cleanup | Flip 5 TODOs once content ready |
| ARCH-2 | Architecture | Dormant Portfolio layer, real WP content behind it | 0 consumers | Carrying cost, zero payoff | P2 | YES (either) | Decide direction | Build `/projects` or leave |
| ARCH-5 | Security-adjacent | No HTML sanitizer on WP rich text | `ArticleContent.tsx` | Compounds with SEC-2/CMS-3 if WP ever compromised | P2 | YES | — | Add sanitizer |
| CQ-1 | Code Quality | Zod not applied at WP response boundary | 8 repositories | Malformed WP response handling less clean than claimed | P2 | YES | — | Add schemas per content type |
| DEP-1 | Dependencies | 4 HIGH npm audit vulns | nanoid/postcss/sharp | Low real exploitability, still real CVEs | P2 | PARTIAL | Approve Next 16 window | Fix nanoid now, defer rest |
| DEP-2 | Testing | Zero test coverage | — | Lint/build/tsc are the only safety net | P2 | YES | — | Scaffold tests |
| OG-1 | SEO | `og:url` missing on 13 static pages | `metadata.ts` gating | Social-share previews missing canonical URL | P2 | YES | — | Add per-page or restructure gate |
| SITEMAP-1 | SEO | Blog category/tag pages missing from sitemap | `sitemap.ts` | Minor discoverability gap | P2 | YES | — | Add taxonomy fetch |
| CONTENT-1 | Content/Code | HTML entities not decoded, live-visible | Blog excerpt + JSON-LD | Cosmetic, user-visible malformed text | P2 | YES | — | Add entity decoding |
| CMS-9 | Content | WP test copy live in public OG tags | `/services/ai-consulting` | Visible in social-share previews | P2 | NO | WP editorial cleanup | wp-admin content edit |
| FORM-2 | Forms/Security | No spam/rate-limit protection | Both layers | Defensible for low-traffic B2B, still open | P2 | YES (honeypot) | CAPTCHA needs provider | Add honeypot minimum |
| FORM-3 | Forms/Content | Newsletter forms are non-functional stubs | Both files | Every submitted email silently discarded | P2 | PARTIAL | Backend decision | Wire to real backend or remove |
| PERF-2 | Performance | Zero analytics instrumented | `package.json` | Zero first-party traffic visibility | P2 | YES | Decide provider | Add analytics |
| ARCH-3 | Architecture | Mock-data flag silently overrides real endpoint | `wordpress.config.ts` | Risk only if mis-set in Vercel Production | P2 | YES (comment) | Confirm Vercel env | Guarding comment + confirm |
| PERF-1 | Performance | `/services/[slug]` no ISR | Build output + **live TTFB now measured: 2-4x slower** | Every visit is a live round-trip | P2 | YES | — | Add `generateStaticParams`+revalidate |
| API-1 | Security/Hygiene | Preview routes' Cache-Control imprecise | Live headers | None functional | P3 | YES | — | `private, no-store` |
| PERF-5 | Performance | Double-priority images (Logo + page hero) | `Navbar.tsx:45` + detail pages | Low — logo too small to be LCP | P3 | YES | — | Drop priority from Logo |
| PERF-6 | Performance | Unconditional highlight.js CSS import | `ArticleContent.tsx` | Minor unused-CSS weight on non-code pages | P3 | YES | — | Conditional import |
| FORM-4 | Forms | No server-side duplicate-lead detection | Pipeline trace | Low | P3 | YES | — | Optional |
| FORM-5 | Forms | No retry on transient failure | Pipeline trace | Low, manual resubmit works | P3 | YES | — | Optional |
| ARCH-4 | Architecture | Dormant navigation layer, WP schema still rejects it | Live-reconfirmed | None — cheap to hardcode | P3 | YES (leave as-is) | — | No action needed |
| ARCH-6, ARCH-7, ARCH-8, ARCH-9 | Architecture | Small duplication/config nits, 3 zero-consumer components | Phase 1 | Minimal | P3 | YES / decision | AutoRotatingImage fate | Batch as one small PR |
| CQ-2, CQ-3 | Code Quality | Missing `server-only` guards; duplicated timeout constant | Phase 1 | None active | P3 | YES | — | Batch fix |
| DEP-3 | Dependencies | Version drift (Next 1 major, TS 2 majors, others) | `npm outdated` | Routine maintenance | P3 | YES | — | Schedule bumps |
| OG-2, CANON-1, IDX-1, META-1, CONTENT-2/3/4, DATE-1, SEO-4/5/6, SEO-7/CMS-4, CMS-8, INFRA-4, JSONLD-1 | SEO/Code | Various small, independent nits | Phase 2 | Cosmetic/low | P3 | YES (mostly) | Some WP/Vercel | Batch opportunistically |
| SEC-1, SEC-2, SEC-5, SEC-6, SEC-7/8, CMS-1, CMS-3, CMS-5, CMS-6, CMS-7 | Security/Content | Standard WP defaults, low-severity, all re-confirmed unchanged | Master audit + this phase's live re-checks | Low | P3 | Mixed | Mostly WP-admin | Optional hardening |
| UX-1, UX-3, UX-4, UX-6, A11Y-1, A11Y-2, A11Y-3 | UX/A11y | Master-audit polish items, not re-verified this pass | Master audit | Low | P3 | YES | Some (A11Y-3: brand-color decision) | Batch with other polish |
| PERF-3 | Performance | No `loading.tsx` anywhere | Master audit, not re-verified this pass (HEAD frozen, inferred unchanged) | Low | P3 | YES | — | Add if perceived-perf becomes a concern |
| DATE-2 | Content | Case studies' publish/modify same-day | Live GraphQL | Unknown significance | INFO | — | WP admin, if it matters | None required |
| API-2 | Security | Disable route has no auth | Live test | None — correct by design | INFO | — | — | None required |

**Cumulative open-item count: 1 P0 · 2 P1 · 15 P2 · ~26 P3/INFO** (several P3 rows above bundle multiple small Phase 1/2 IDs for table density — see each phase's own report for full individual detail).

---

## 14. CLAUDE-FIXABLE TASKS (P0 → P3)

**P1:** SEO-2 (SelectedWork prop leak).
**P2:** SEC3-1 (projectUrl scheme validation), PERF-4 (duplicate fetch), A11Y-4 (focus trap), A11Y-5 (reduced-motion), ARCH-5 (sanitizer), CQ-1 (Zod schemas), DEP-1's nanoid portion, DEP-2 (test scaffolding), OG-1, SITEMAP-1, CONTENT-1, FORM-2's honeypot portion, PERF-2 (once a provider is chosen), ARCH-3's guarding comment, PERF-1 (ISR for services).
**P3:** API-1, PERF-5, PERF-6, FORM-4, FORM-5, ARCH-6/7/8, CQ-2/3, OG-2, CANON-1, IDX-1, META-1, CONTENT-2/3/4, DATE-1, SEO-4/5/6, JSONLD-1, and the remaining P3 polish items from prior phases.

**None of these require credentials, WordPress access, or a business decision to implement** — they're all self-contained code changes.

---

## 15. MANUAL TASKS (P0 → P3)

**P0:** SEO-1 — wp-admin, Yoast indexability toggle.
**P1:** FORM-1 — confirm Vercel Production env values + `wp-config.php` storage constant, then submit and confirm one real test lead.
**P2:** CMS-9 (WP service content cleanup), ARCH-1's content-readiness gate, ARCH-2's direction decision (Portfolio/projects), FORM-3's backend decision, PERF-2's analytics-provider decision, DEP-1's Next 16 upgrade-window approval, ARCH-3's Vercel env confirmation.
**P3:** ARCH-9's `AutoRotatingImage` fate decision, A11Y-3's brand-color decision, various WP-admin content/plugin polish items from Phase 1/2's own manual-task lists (not repeated in full here — see those reports).

---

## 16. IMPROVEMENTS (P0 → P3)

No P0/P1-level improvements. **P2:** none beyond what's already captured as a finding above. **P3:** COOP/CORP headers (optional, low-value here), preview-route Cache-Control precision, the various small code-duplication nits (CQ-3, ARCH-8), routine dependency version bumps (DEP-3).

---

## 17. ALREADY CORRECT / CLOSED ITEMS

**Re-verified live/fresh this phase, all CLOSED, zero regressions:** every master-audit SEC-*/CMS-* WordPress-security item (§2, A7); www canonicalization; CMS noindex protection; Case Study/Service Preview auth mechanics (constant-time comparison, generic errors, no open redirect, cookie flags); `?preview=true` cosmetic-only behavior; testimonial hover-clipping fix; `SelectedWork`'s `#work` anchor (now structurally unbreakable, not just currently-fine); JSON-LD escaping; robots.txt; all npm-dependency and dead-code findings from Phase 1; the WordPress plugin's email-header-injection non-exploitability (re-verified from source, not cited); Server Action CSRF protection; root error/global-error boundaries (both sound, no leakage).

**Positive patterns worth citing, not just absence-of-bugs:** the `TestimonialSlider` component's accessibility implementation (region role, keyboard nav, `inert` on off-screen slides, correct reduced-motion handling); the WordPress plugin's per-field REST validation (length-capped, sanitize-callback-enforced before the handler ever runs); the SSRF guard on the mshots pathway (thorough, correctly scoped to what this app's own server can and can't be blamed for); zero unused npm dependencies; zero unnecessary Client Components anywhere in the codebase.

---

## 18. UNKNOWN / NOT VERIFIABLE

- **Email delivery** (FORM-1) — cannot be proven without a real submission this audit correctly didn't perform.
- **True rendered-viewport behavior at 320-1920px breakpoints** — the browser-automation viewport tool remains unreliable in this environment (reconfirmed today, matching the master audit's prior finding); all breakpoint-specific visual claims are code-inference only.
- **Whether `generateMetadata`+body's duplicate WordPress calls (PERF-4) actually cost a second real network round-trip** — Next's fetch memoization behavior for POST requests specifically wasn't empirically confirmed either way.
- **LCP/FCP/CLS/INP real-user metrics** — no Lighthouse/RUM access from this environment; not fabricated.
- **Whether CSP's `unsafe-inline` provides any practical backstop against SEC3-1's javascript:-URL scenario** — not fully verifiable across browsers from here; treat SEC3-1 as needing a fix regardless of this open question.
- **WordPress's `asPreview` resolver's behavior on a trashed/pending post given a valid id** — would require creating and trashing real WordPress test content, outside this audit's safe scope.
- **CMS outage/500/malformed-response behavior against real production** — verified by source (8s timeout, typed errors, strict/soft split), not by inducing a real outage.
- **Whether the live blog post's content actually uses the CSP-provisioned YouTube embed capability** — provisioned, not confirmed exercised.

---

## 19. RECOMMENDED NEXT STEP

Do not start fixing yet — this phase's own instruction. When fixing does begin: **SEO-1 first** (wp-admin, ~20 minutes, blocks nothing else but blocks everything downstream of it mattering), **FORM-1 second** (confirm the business's actual lead intake works — this is the one item where "we think it's fine" isn't good enough), then batch the Claude-fixable P2s from §14 as 2-3 small, independent PRs (security/SEC3-1 first given it's the only one with any security framing; the rest can go in any order), then work through P3 opportunistically. Full detail and reasoning for every item is in §13's master table and the three phase reports it consolidates.

---

## 20. GIT SAFETY

- **Files changed:** NO (by this session's own actions).
- **Files created:** YES — exactly one, this report (`PHASE_3_SECURITY_PERFORMANCE_ACCESSIBILITY_UI_CODE_QUALITY_AUDIT.md`), plus the `PHASE_1_...` and `PHASE_2_...` reports already created and disclosed in this same conversation's prior turns.
- **Files deleted by this session's tools:** NO. **Important disclosure:** between this phase's baseline check and this final check, git status shows **two additional** pre-existing `docs/*.md` files (`docs/contact-form-wordpress-endpoint.md`, `docs/wordpress-contact-form-installation.md`) became unstaged-deleted in the working tree, joining the 9 already present since before Phase 1 began. HEAD did not move (still `0ff429c`), so this was not a commit. None of this session's own direct tool calls touched `docs/`, and all six of this phase's forks were scoped exclusively to security/performance/accessibility/forms/dependency code under strict, repeated, explicit read-only instructions with no plausible reason to touch documentation. This is most consistent with the user's own concurrent manual continuation of the same documentation-consolidation effort the master audit's own text already describes (it explicitly references superseding prior `docs/` files "see cleanup log") — but this assessment is not certain, and is disclosed as observed fact rather than asserted as confirmed cause. **Nothing was restored, further modified, or touched by this session** — flagging for your awareness only.
- **Staged:** NO.
- **Commit:** NO.
- **Push:** NO.

---

**PHASE 3 DEEP AUDIT COMPLETE.**
**NO CODE OR CONFIGURATION WAS MODIFIED BY THIS SESSION.**
**NO COMMIT OR PUSH WAS PERFORMED.**
**Please review the two additional `docs/*.md` deletions noted in §20 and confirm they're expected before this working tree is next touched.**
