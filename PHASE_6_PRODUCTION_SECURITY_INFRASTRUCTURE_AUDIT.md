# PHASE 6 — DEEP PRODUCTION SECURITY + PRIVACY + INFRASTRUCTURE + SECRETS AUDIT

**Audit Date:** 2026-09-02
**Scope:** Read-only. Find every realistic security, privacy, credential, infrastructure, deployment, authentication, authorization, configuration, and data-exposure weakness that still exists. This report contains findings independently verified by Phase 6 — prior-phase findings are cited only as regression-check context, not restated as new.
**Repository State:** `tff-digital @ main`, `0ff429c8b1bdfc254c31de6860c972f6f7ee4e91` — unchanged throughout (confirmed §37).

---

## 1. Executive Summary

Five prior phases already covered security from several angles — a dedicated master-audit security pass, Phase 3's exhaustive header/XSS/SSRF/preview-auth deep dive, Phase 4's WordPress-editorial-safety findings, Phase 5's resilience-adjacent security findings. Phase 6 was built to find what a sixth, dedicated pass — armed with every prior phase's context — could still add. It targeted specifically the territory no prior phase had touched: **git history** (never scanned for secrets before), **actual production JS bundles** (never downloaded and inspected before), **certificate and HTTPS enforcement on the CMS domain specifically** (only the frontend had been checked this way), **whether WPGraphQL's `asPreview` mechanism is independently authenticated or relies entirely on this app's own secret gate** (a real, previously-unasked question), **live cookie/storage behavior** (never directly inspected in a real browser before), and **whether security-relevant failures are logged at all** (extended here specifically to preview-auth attempts, beyond what Phase 5 already found for the lead pipeline).

**The header result is reassuring, and it's worth stating plainly rather than manufacturing drama: this system is fundamentally sound.** Git history has never contained a committed secret, across all 69 commits. The production JS bundles contain zero leaked credentials, paths, or embedded secrets. Source maps are correctly blocked. WPGraphQL's `asPreview` flag was tested directly — unauthenticated, against known IDs, ten adjacent/unknown IDs, and deliberate cross-content-type confusion — and every single test came back properly gated: **the app's preview secret is not the only thing standing between the public internet and draft WordPress content; WordPress enforces its own independent authentication too.** That's genuine defense-in-depth, confirmed empirically rather than assumed. A live cookie/storage check on a real browser found zero cookies and zero client-side storage on a normal visit — there is no tracking to raise for privacy review because there is no data collection happening at all.

**What Phase 6 did find is real but modest — 7 new findings, 0 P0, 0 P1, 2 P2, 2 P3, 3 INFO:**

1. **DNS-1 (P2):** `cms.tffdigital.com` serves plain HTTP with no redirect to HTTPS and no HSTS header — a hosting-configuration gap outside this repository's control, narrow in practice since this app's own code consistently uses `https://` throughout, but worth closing as defense-in-depth given it's the same host that receives WordPress Application Password credentials for preview authentication.
2. **LOG-1 (P2):** a failed preview-secret attempt produces **zero server-side log trace** — a genuine, previously-undiscovered blind spot distinct from Phase 5's already-tracked lead-pipeline logging gaps. Low likelihood of an actual attack succeeding (the secret's entropy and the constant-time comparison already make brute-forcing impractical), but total lack of *detectability* is a real, independent gap.
3. **GQLSCHEMA-1 (P3):** WPGraphQL's own default error formatting leaks real field/type names via "did you mean" suggestions even with introspection disabled — a known class of GraphQL hardening gap, **independently discovered by two separate forks this phase**, which strengthens confidence it's real and reproducible. Low impact — only schema structure leaks, never data.
4. **BRUTEFORCE-1 (P3):** `.env.example`'s guidance for the preview secret is vague ("any long random string," no concrete method or minimum length) — worth tightening given LOG-1's finding that a probing attempt would go undetected.

**No confirmed vulnerability was found anywhere in this phase.** Every finding above is either a hardening opportunity, a detectability gap, or something requiring manual verification this repository cannot perform (Vercel dashboard settings, the live production preview secret's actual strength).

---

## 2. Security Architecture Map

Synthesized from everything established across all six audit phases — this is a map, not new investigation.

**Components and trust boundaries:**

| Component | Trust level | Surface type |
|---|---|---|
| Browser (any visitor) | Untrusted | Public entry point |
| Vercel edge / Next.js frontend (`www.tffdigital.com`) | Trusted (this app) | Public surface — all ~21 real routes, HTTPS-enforced, CSP+security headers applied |
| Next.js server-side code (Server Components, Server Actions, 3 API routes) | Trusted (this app) | Server-only — never reaches the browser |
| WordPress (`cms.tffdigital.com`, Bluehost) | Trusted (first-party CMS) | Mixed — public theme/REST/GraphQL surfaces (noindexed) + `wp-admin` (authenticated, outside this repo's control) |
| WPGraphQL | Trusted, server-queried | Public for published content; independently authenticated for `asPreview` (confirmed this phase, §12) |
| WordPress REST (`/wp-json/*`) | Trusted, server- and public-queried | Mixed — most namespaces read-only/public; `headless/v1/leads` is intentionally public-write, protected by field validation not auth |
| Custom plugin (`tff-headless-leads`) | Trusted (this project's own code) | Defines the leads endpoint, View/Preview URL rewriting, CMS-noindex hardening |
| Resend (email) | Trusted third party | Server-only, API-key authenticated, one-way send |
| WordPress.com mshots | Trusted third party, client-only | Browser fetches directly; this app's server never proxies or fetches the target URL itself |
| Google Maps / YouTube embeds | Sandboxed third party | Browser-side iframes, CSP-constrained |
| Gravatar | Trusted third party, client-only | Browser-side avatar image fetch |
| DNS / Vercel edge / Bluehost origin | Infrastructure | www/apex resolve to Vercel; `cms` resolves to Bluehost; nameservers remain Bluehost's |

**Sensitive data flows:** contact-form PII (name, email, phone, company, budget, message) flows Browser → Server Action (server-only) → WordPress REST (server-only, HTTPS) → WordPress database, then independently to Resend (server-only, HTTPS) for two outbound emails. No PII is ever returned to the browser in any response (confirmed §10). No analytics, tracking, or third-party data-sharing exists anywhere (confirmed §28).

**Where an attacker can realistically enter:** the public route surface (hardened; Phase 5's SMOKE-2 crash bug is a resilience issue, not a compromise vector); the 3 preview API routes (secret-gated, now confirmed backed by WordPress's own independent `asPreview` auth as a second layer); the intentionally-public leads REST endpoint (protected by field validation, not auth, by design); WordPress's own `wp-admin`/login surface (standard WordPress auth, not deeply probed here — that would require credentials this audit doesn't have and shouldn't seek); and, in principle, the git repository or production JS bundles if either ever leaked a secret — both confirmed clean this phase.

---

## 3. Attack Surface Inventory

Public, unauthenticated surfaces: all frontend routes; `cms.tffdigital.com`'s WordPress theme pages; `/graphql` (read access to published content); most `/wp-json/*` namespaces (read); `/wp-json/headless/v1/leads` (write, by design); `xmlrpc.php` (standard WordPress default, already tracked). Authenticated surfaces: the 3 preview API routes (app secret + independently-enforced WordPress `asPreview` auth); `wp-admin`/`wp-login.php` (WordPress's own auth, standard hardening headers present on the login page specifically — confirmed §19); any WPGraphQL mutation surface (none used by this app; the leads flow uses REST, not GraphQL mutations, confirmed in Phase 1). Server-only, never browser-reachable: all 12 environment variables (re-confirmed §5), the WordPress Application Password, the Resend API key, the preview secret.

---

## 4. Secrets & Credentials

**Clean.** A fresh, dedicated secret-pattern sweep (distinct from Phase 1's reference-parity check) across `src/`, `.env.example`, `.gitignore`, all documentation, mock data, and the WordPress plugin found zero hardcoded secret values anywhere. Every credential-shaped hit is a variable name or a `process.env.*` reference, never a literal value. `.env.example`'s 12 entries are all genuine placeholders or non-sensitive real business addresses (`leads@tffdigital.com`, `info@tffdigital.com` — correct, not a leak). `.gitignore` covers every `.env*` variant plus `*.pem`. The WordPress plugin only ever *references* its constant names (`TFF_HEADLESS_PREVIEW_SECRET`, `TFF_LEAD_STORAGE_METHOD`) — real values exist exclusively in the live server's `wp-config.php`, entirely outside this repository. **No new finding.**

---

## 5. Environment Variables

Beyond Phase 1's exhaustive reference-parity sweep (cited, not redone), Phase 6 traced a genuinely new question for each sensitive variable: **is missing configuration safe?**

| Variable | If unset | Failure mode |
|---|---|---|
| `WORDPRESS_PREVIEW_SECRET` | Resolves to `""` | `isValidPreviewSecret()` always returns `false` against an empty configured secret — **fails closed**; preview permanently 401s rather than becoming bypassable |
| `WORDPRESS_PREVIEW_USERNAME` / `_APP_PASSWORD` | Unset | Explicit thrown `Error` before any request attempt — loud, safe failure |
| `RESEND_API_KEY` | Unset | Typed `EmailError("config")`, caught by the existing `Promise.allSettled` — contained, doesn't crash the lead-save flow |
| `WORDPRESS_GRAPHQL_ENDPOINT` | Empty string | Automatically forces `useMockData: true` — no crash, but silent mock-content substitution. This independently re-confirms the same mechanism Phase 1's ARCH-3 already tracks; not a new finding, but worth restating precisely: "safe" here means crash-avoidance, not loud detectability, which is exactly ARCH-3's own point |
| `WORDPRESS_REST_URL` | Empty string | Fails fast on an invalid-URL fetch, caught by the same typed `WordPressError` handling used everywhere else |

No missing-configuration path produces a crash with leaked internal detail, nor a silent security bypass. Client-side leak re-spot-checked, unchanged from Phase 1. **No new finding.**

---

## 6. Git History

**Genuinely new work — no prior phase inspected git history.** Searched all 69 commits in the repository's full history: zero commits ever added a real `.env`/`.env.local`/`.env.production` file (confirmed via `git log --all --diff-filter=A`, not just the current tree); the only `.env`-shaped file ever committed, at any point in history, is the intentionally-tracked `.env.example` template; a broad content sweep across every historical diff for high-signal secret patterns (cloud API key formats, PEM headers, common token prefixes) found zero matches; the WordPress plugin's full history was checked for ever having defined its secret constants with a real value — it never has, only constant *names* referencing `wp-config.php`.

**No HISTORICAL EXPOSURE. No ACTIVE/POTENTIALLY-ACTIVE CREDENTIAL EXPOSURE.** This repository's git history has never contained a committed secret. **No new finding — a clean, positive, and newly-verified result.**

---

## 7. WordPress Security

Master audit's §5/§8 and Phase 3's A7 already re-verified this exhaustively and found it CLOSED with zero regressions; Phase 6 re-confirmed the same facts live once more (introspection disabled, `/wp-json/wp/v2/plugins` requires auth, `headless/v1/leads` correctly minimal on GET/OPTIONS, REST namespace list byte-identical to every prior check, no new custom routes) and applied this phase's own classification scheme for the first time:

| Item | Classification |
|---|---|
| `wp-admin`/`wp-login.php` reachable | **EXPECTED** — WordPress requires this surface |
| GraphQL introspection disabled | **EXPECTED/GOOD** |
| `/wp-json/wp/v2/plugins` requires auth | **EXPECTED/GOOD** |
| `/wp-json/wp/v2/users` enumerates "admin" | **UNNECESSARY**, low-severity, standard WP default, easily hardened, not urgent |
| XML-RPC live (`pingback.ping`/`system.multicall`) | **ACCEPTABLE-BUT-HARDENABLE** — standard WordPress default, already tracked elsewhere |
| `headless/v1/leads`'s public `permission_callback: '__return_true'` | **ACCEPTABLE-BY-DESIGN** — protection is field-level validation, appropriate for a public lead-submission endpoint |
| `wp-content/plugins/` and `/themes/` return empty 200 (not a directory listing) | **GOOD** — a deliberate hardening pattern, not a gap |
| `.env`/`wp-config.php.bak`-shaped requests return `406` | **GOOD** — strongly suggestive of an active WAF rule |

No new finding in this section beyond what's tracked in §26 (DNS-1) and §29 (LOG-1) below.

---

## 8. WPGraphQL Security

#### The key test this phase: is `asPreview` independently authenticated?

This is the single most important open question Phase 6 set out to answer, and it was tested directly rather than trusted from a code comment. The app's own comment (`case-study.queries.ts`) claims WPGraphQL only returns `asPreview` data for authenticated requests. **Verified empirically:**
- `asPreview:true`, fully unauthenticated, against a known-published ID → identical to `asPreview:false` (no elevated data).
- `asPreview:true`, unauthenticated, against 10 adjacent/unknown case-study IDs → all `null`.
- Cross-content-type confusion: a real blog-post ID and a real service ID submitted through the case-study `asPreview` field → `null`; a real case-study ID through the service `asPreview` field → `null`. Type-scoping holds even with `asPreview:true` set, unauthenticated.
- REST equivalents on the same adjacent IDs → `404`.

**Conclusion: the app's secret-gate is not a single point of failure — WordPress independently enforces its own authentication requirement for `asPreview`, and its type-scoped resolvers prevent cross-content-type leakage regardless of what the application layer does.** This is genuine, confirmed defense-in-depth. **No finding — a significant reassuring result worth documenting precisely because it was previously untested.**

#### GQLSCHEMA-1 — GraphQL schema field/type names leak via "did you mean" error suggestions
- **CATEGORY:** Information Disclosure / GraphQL Hardening
- **SEVERITY:** P3
- **LOCATION:** `https://cms.tffdigital.com/graphql` — WPGraphQL/graphql-php's own default error formatting, not application code.
- **EVIDENCE:** A deliberately misspelled field (e.g. `titel` instead of `title`) returns `"Cannot query field \"titel\" on type \"CaseStudy\". Did you mean \"title\" or \"date\"?"`. A misspelled root field returns similarly-structured suggestions for real root field names.
- **VERIFICATION:** Live-tested directly against production, reproducible — **independently discovered by two separate research passes this phase**, strengthening confidence.
- **ATTACK/FAILURE SCENARIO:** Even with introspection correctly disabled, an attacker can slowly reconstruct field and type names by systematically probing plausible guesses and reading the suggestion text — a well-documented GraphQL hardening gap, not specific to this app. This only ever reveals schema **structure**, never data; every data-access test in this section confirms actual content stays properly gated regardless.
- **PRODUCTION IMPACT:** Low. Meaningfully slower and harder than direct introspection, and the same field/type shapes are substantially inferable from the public frontend's own rendered output anyway. Somewhat undermines the stated intent of disabling introspection as a hardening measure, but doesn't provide a path to data, credentials, or unpublished content.
- **CLAUDE CAN FIX?** NO — requires a WPGraphQL-side custom error formatter or extension, not application code in this repository.
- **MANUAL ACTION REQUIRED?** YES — WordPress/WPGraphQL configuration, optional hardening.
- **RECOMMENDATION:** Low priority. Worth a note for whoever owns the WordPress/WPGraphQL configuration if defense-in-depth against schema enumeration is ever prioritized.

#### CORS-GQL-1 — Wildcard CORS on the GraphQL endpoint (safe combination)
- **CATEGORY:** CORS Configuration. **SEVERITY:** INFO.
- **EVIDENCE:** `Access-Control-Allow-Origin: *`, no `Access-Control-Allow-Credentials` header, on both actual requests and OPTIONS preflight against `cms.tffdigital.com/graphql`.
- **ATTACK/FAILURE SCENARIO:** None realistic — wildcard origin without credentials is the browser-spec-mandated *safe* combination (no cookies/credentials can ever be sent cross-origin under this configuration), and this endpoint has no cookie-based session to steal — the app's own preview auth uses a server-side-only Basic Auth header, never a browser-managed WordPress cookie. This is WPGraphQL's own plugin default, not project-configured.
- **PRODUCTION IMPACT:** None. Documented because this specific endpoint's CORS behavior had not been tested in any prior phase.
- **CLAUDE CAN FIX?** N/A. **MANUAL ACTION REQUIRED?** NO.

---

## 9. REST API Security

`headless/v1/leads`'s CORS re-confirmed live: reflects any `Origin` with `Access-Control-Allow-Credentials: true`, identical to the master audit's already-tracked SEC-1. Classified this phase as **RISKY-but-EXPECTED** — a WordPress-core default (`rest_send_cors_headers`), not plugin-introduced, low practical risk since this endpoint is public/unauthenticated by design with no cookie session to leverage. Not re-filed as new. No genuinely new finding in this section beyond what §8/§29 already cover.

---

## 10. Lead/PII Security

Fresh trace with a privacy-specific lens (distinct from Phase 3/4's functional-completeness lens). Fields collected: name, email, phone (optional), company (optional), service interest, budget, message, source (hardcoded `"website"`) — every field serves an evident lead-qualification purpose, no over-collection found.

**Response shape confirmed clean.** A successful submission returns only `{"id": <int>, "status": "success"}` — no name/email/message is ever echoed back. The error path returns a fixed generic string; the real WordPress-side error detail is logged server-side only via `error_log()`, never returned to the client. The Next.js Server Action's three catch branches all return hand-written generic messages with no interpolation of submitted values — no client-visible path (console, network response, or UI) can leak submitted PII back to the browser.

One minor, non-actionable observation: in `'cpt'` storage mode, the returned `id` is WordPress's global post ID (a shared sequence across all post types, not lead-specific) — a very minor content-velocity signal if it were ever logged or displayed client-side, which it currently isn't anywhere in this app. Not filed as a finding. **No new finding.**

---

## 11. Authentication & Authorization

Covered in depth across §8 (asPreview), §12 (preview routes), and §7 (WordPress boundary classification). The IDOR sweep in §8 — adjacent case-study IDs plus deliberate cross-content-type confusion, all via the public/unauthenticated surface — found no privilege-escalation or unauthorized-access path anywhere tested. **No new finding beyond what's already documented above.**

---

## 12. Preview Security

**3/3 fast regression spot-checks PASS, no regression:** wrong secret on `/api/preview/case-study` → still 401; the mshots SSRF guard in `website-preview.ts` → unchanged, still thorough; the case-study "Visit project" link's missing scheme validation (Phase 3's SEC3-1) → confirmed still open, not silently fixed.

**Cookie flags, cache behavior, redirect-target safety, and `?preview=true`'s cosmetic-only status** are all unchanged from Phase 3/5's exhaustive prior verification — not redone.

#### BRUTEFORCE-1 — Vague preview-secret generation guidance
- **CATEGORY:** Preview Authentication / Documentation Hardening. **SEVERITY:** P3.
- **LOCATION:** `.env.example` (guidance for `WORDPRESS_PREVIEW_SECRET`).
- **EVIDENCE:** The documented guidance reads only "any long random string" — no minimum length, no suggested generation command, no complexity requirement.
- **VERIFICATION:** Direct read of `.env.example`; the local `.env.local` value's length was checked programmatically (confirmed empty, consistent with every prior phase) without ever reading or printing its content. **The actual production (Vercel) value's strength is unknown from this repository.**
- **ATTACK/FAILURE SCENARIO:** No rate limiting exists on the preview routes (already established, not re-derived). That fact is low-severity *only if* the configured secret has real entropy — vague guidance increases the chance an operator sets something short or guessable. This is a documentation gap that could produce a real weakness, not a demonstrated one.
- **PRODUCTION IMPACT:** Unknown/contingent on the actual deployed value, which this audit cannot see.
- **CLAUDE CAN FIX?** PARTIAL — can strengthen `.env.example`'s guidance; cannot verify or change the deployed secret.
- **MANUAL ACTION REQUIRED?** YES — confirm the production secret has real entropy (32+ random characters); rotate if uncertain.
- **RECOMMENDATION:** Update `.env.example` to prescribe a concrete generation method (e.g. `openssl rand -hex 32`) and a minimum length.

---

## 13. Open Redirect Audit

**Swept the entire codebase, not just the preview routes Phase 3 already checked. Definitive result: no open-redirect surface exists anywhere in this application.** Every `redirect(`/`NextResponse.redirect(`/`permanentRedirect(` call site (exactly 3, all in the preview routes) resolves to either a hardcoded constant or a value built exclusively from a WordPress-authenticated, server-fetched slug — `request.url` is used only as the base origin for URL resolution, never as path input. Zero `returnTo`/`redirect_uri`/`callback_url`-shaped query parameters exist anywhere in `src/`. The one `window.location` reference found is a read of `.hash`, not a navigation assignment. The WordPress plugin has zero `wp_redirect`/`wp_safe_redirect` calls — its "redirect" behavior is entirely through permalink-generation filters, not an HTTP redirect it issues. **No finding — confirmed clean by an exhaustive sweep, not assumed.**

---

## 14. SSRF Audit

The mshots website-preview pathway's SSRF guard (`website-preview.ts`) was re-read in full this phase and reconfirmed unchanged — still blocks localhost, all standard private IPv4/IPv6 ranges, link-local addresses, and restricts to http/https by construction. No new SSRF surface found anywhere else in the codebase. **No new finding.**

---

## 15. XSS/HTML Injection

**Swept for one specific angle not yet tested: metadata attribute-breakout via a literal `"` character.** `buildMetadata()` returns a properly-typed Next.js `Metadata` object, which Next.js itself serializes into `<meta>` tags with correct attribute escaping — a repo-wide grep for raw `<meta ` string construction found zero matches outside code comments. No raw HTML/string-templated metadata exists anywhere for a quote character to break out of. **Confirmed clean by source, not assumed — no finding.**

Phase 3's SEC3-1 (case-study "Visit project" link, no scheme validation on `projectUrl`) re-confirmed still open via this phase's regression spot-check (§12) — not re-derived or re-filed as new here, since it's already tracked and unchanged.

---

## 16. CSRF/CORS

The contact form's mechanism re-confirmed unchanged in one line: `src/features/contact/actions.ts` still opens with `"use server"` — a genuine Server Action, not a hand-rolled route handler, with Next.js's inherent same-origin CSRF protection applying natively. WordPress's own endpoint CORS behavior is covered in §8/§9 above. **No new finding.**

---

## 17. Security Headers

No new investigation this phase beyond what Phase 3's A1 already exhaustively live-tested and confirmed unchanged (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS on the frontend). The one genuinely new header-related finding this phase is domain-specific, not header-content-specific — see §25 (DNS-1) for `cms.tffdigital.com`'s missing HSTS/HTTPS-redirect.

---

## 18. Content Security Policy

No new investigation — Phase 3's A1 already assessed CSP's `unsafe-inline` necessity (documented, required for Next.js RSC hydration without a larger middleware-based nonce architecture), confirmed no wildcard sources, and confirmed the policy is enforcing (not report-only). Nothing new to add this phase.

---

## 19. Clickjacking

`X-Frame-Options: SAMEORIGIN` + CSP `frame-ancestors 'self'` on the frontend already confirmed live in Phase 3 — both headers agree, no conflict, and together deterministically prevent cross-origin framing in every modern browser; no live iframe-embedding test was needed to confirm what the headers already guarantee.

#### CLICKJACK-1 — CMS general pages lack frame-protection headers (the sensitive page has them)
- **CATEGORY:** Clickjacking / Defense-in-Depth. **SEVERITY:** INFO.
- **EVIDENCE:** `cms.tffdigital.com`'s general theme-rendered pages (homepage, posts) carry neither `X-Frame-Options` nor a CSP `frame-ancestors` directive. However, `cms.tffdigital.com/wp-login.php` — the one page where clickjacking-assisted credential phishing would actually matter — **does** carry both, almost certainly WordPress core's own long-standing default protection on the login screen specifically.
- **ATTACK/FAILURE SCENARIO:** The public, noindexed CMS theme pages contain no privileged form or state-changing action, so framing them has no meaningful clickjacking payoff even without the header — the actually-sensitive surface is already covered.
- **PRODUCTION IMPACT:** Negligible.
- **CLAUDE CAN FIX?** NO. **MANUAL ACTION REQUIRED?** NO.
- **RECOMMENDATION:** None required. Noted for completeness since the audit brief asked the question directly.

---

## 20. Rate Limiting

Confirmed absent everywhere in the pipeline (contact form, preview routes, WordPress REST endpoint) — unchanged from FORM-2, already exhaustively established across 3 prior phases. **No new investigation performed, no new finding** — this section's value this phase is in §21's DoS-specific analysis below, which asks a sharper question than "does rate limiting exist."

---

## 21. DoS / Resource Abuse

Two real, previously-unasked questions resolved, both reassuringly:

1. **Sitemap pagination (`getPosts({first:1000})`/`getCaseStudies({first:1000})`) is NOT a request-time amplification vector.** `sitemap.ts`'s own code confirms `sitemap.xml` is statically generated at build time — these calls run once per deploy, never per visitor request, and are not attacker-triggerable. The only unauthenticated WordPress content-creation path (the leads endpoint) creates `tff_lead` posts, a CPT the sitemap generator never queries and which is confirmed `public => false`.
2. **The contact form's oversized-message question (Phase 5's FORM-RT-1) is NOT a DoS vector.** WordPress's own REST `args` schema enforces a 5000-character cap via `validate_callback`, which runs **before** the handler, sanitization, or storage ever execute — an oversized payload gets a `400` at the earliest possible point. FORM-RT-1's UX-confusion angle (the client doesn't cap length, so the user sees a generic error) remains valid and open, but the resource-abuse angle specifically is a non-issue: maximum real payload per request is tightly bounded regardless of rate limiting.

**Inconclusive, honestly marked:** WPGraphQL's `first` parameter cap could not be conclusively tested — a `posts(first: 100000)` query returned normally, but since only 1 real post exists site-wide, this can't distinguish "no cap enforced" from "a cap exists but is irrelevant at this content volume." Request body size limits were reasoned from Next.js's documented framework default (1MB, no override found in `next.config.ts`) rather than empirically triggered, per this phase's no-destructive-testing constraint.

**No new finding** — both concretely-testable risks resolve to "already bounded," worth recording as a positive confirmation.

---

## 22. Dependency/Supply Chain

`npm audit`/`npm outdated` cited as unchanged — identical output across three independent runs already this session (Phases 1, 3, 5): 4 HIGH/0 CRITICAL via nanoid/postcss/sharp, TypeScript 2 majors behind. Not re-run a fourth time.

**Genuinely new check this phase:** every direct and dev dependency's own `package.json` was inspected for `preinstall`/`install`/`postinstall` scripts. **Zero direct or dev dependencies define any install-time script** — a clean, positive supply-chain result; no install-time code-execution vector exists among this project's dependencies. **No new finding.**

---

## 23. Vercel/Deployment Security

No `vercel.json` in the repository (confirmed fresh). `next.config.ts` has no `rewrites`/`redirects` beyond the known `headers()` function — no unintended public routes created via configuration.

#### VERCEL-1 — Credential env-var Preview-vs-Production scoping cannot be verified from this repository
- **CATEGORY:** Deployment Configuration / Credential Exposure Risk. **SEVERITY:** INFO** (a verification gap, not a confirmed vulnerability).
- **LOCATION:** Vercel project dashboard settings — outside this repository's visibility entirely.
- **EVIDENCE:** Env vars are referenced identically in code regardless of deployment target; the Production-vs-Preview distinction exists only in Vercel's dashboard (per-variable Environment checkboxes), which this repository cannot see.
- **ATTACK/FAILURE SCENARIO:** If `RESEND_API_KEY`, `WORDPRESS_PREVIEW_APP_PASSWORD`, or `WORDPRESS_PREVIEW_SECRET` are scoped to both Production and Preview (a common convenience default), every preview deployment — typically a predictable, unauthenticated `*.vercel.app` URL, sometimes shared in PR comments — would carry real production credentials, a materially more exposed surface than the production domain itself.
- **PRODUCTION IMPACT:** Unknown/unverified — a plausible common misconfiguration pattern, not confirmed either way.
- **CLAUDE CAN FIX?** NO. **MANUAL ACTION REQUIRED?** YES.
- **RECOMMENDATION:** Verify in Vercel's dashboard that credential-bearing env vars are scoped to Production only, unless Preview-environment testing specifically requires them.

---

## 24. Source Maps/Bundles

**Genuinely new — no prior phase downloaded and inspected actual production bundles.** All 17 real production JS bundles referenced by the live homepage (1.1MB total) were downloaded and scanned directly: zero matches for any environment variable name, zero absolute local file paths, zero credential-shaped assignments. The only `"localhost"` string found is inline with generic WHATWG host-normalization logic from a bundled URL-parsing library, not this app's server-only SSRF-guard code (which has no client import path) and not a credential.

**Source maps confirmed not exposed.** No `productionBrowserSourceMaps` override exists in `next.config.ts`, so Next's secure default applies. Live-tested `.js.map` for 3 real bundle URLs — all return **403** (a Vercel-level block, stronger than a mere 404). Zero `sourceMappingURL` comments found in any bundle. **No new finding — confirmed clean.**

---

## 25. Domain/HTTPS

#### DNS-1 — `cms.tffdigital.com` has no HTTP→HTTPS enforcement and no HSTS
- **CATEGORY:** Transport Security / Defense-in-Depth. **SEVERITY:** P2.
- **LOCATION:** `cms.tffdigital.com` — Bluehost-hosted infrastructure, outside this repository's control.
- **EVIDENCE:** `http://cms.tffdigital.com/` returns a full `200` page with no redirect to HTTPS. `https://cms.tffdigital.com/` carries no `Strict-Transport-Security` header at all. By contrast, both `www.tffdigital.com` and the apex correctly 308-redirect HTTP→HTTPS and both carry `strict-transport-security: max-age=63072000`.
- **VERIFICATION:** Live `curl` against all three hosts, both HTTP and HTTPS.
- **ATTACK/FAILURE SCENARIO:** No normal user path leads a browser to `http://cms.tffdigital.com` — this isn't a page real visitors reach. The realistic exposure is narrower: this app's own server-side WordPress client authenticates to this exact host using a WordPress Application Password (Basic Auth, base64-*encoded*, not encrypted) for preview requests. If `WORDPRESS_GRAPHQL_ENDPOINT`/`WORDPRESS_REST_URL` were ever misconfigured to `http://` — a plausible typo, not currently the case given this repository's consistent `https://` usage everywhere checked across every prior phase — Application Password credentials would transit in cleartext to a network-position attacker. The absence of server-side HTTPS enforcement means this depends entirely on the client always getting it right, not on the server refusing to allow the mistake.
- **PRODUCTION IMPACT:** Low-likelihood given current, consistent configuration, but a real defense-in-depth gap.
- **CLAUDE CAN FIX?** NO — Bluehost/Apache-level configuration.
- **MANUAL ACTION REQUIRED?** YES — a Bluehost-side HTTP→HTTPS redirect and HSTS header for `cms.tffdigital.com`; low urgency given no active exploitation path identified.
- **RECOMMENDATION:** Add the redirect and HSTS header on the CMS host. Optionally, add an explicit `https://` example in `.env.example` for the WordPress URL variables as a cheap guardrail against future misconfiguration.

**Confirmed clean, not findings:** all three hosts hold currently-valid Let's Encrypt certificates with correct subject/SAN matches, none expiring imminently. Apex→www redirect chain unchanged from Phase 2. Mixed-content check found only the standard SVG XML namespace URI (a false positive, not real mixed content). A small passive subdomain sweep (`staging.`, `dev.`, `api.`, `admin.`) found no DNS records for any; `mail.` resolves to the same Bluehost IP as `cms.`, expected mail infrastructure.

---

## 26. CMS/Admin Exposure

Covered in depth in §7's classification table above. One additional, carefully-verified confirmation: `wp-content/plugins/` and `/themes/` both return an empty `200` rather than a directory listing — a deliberate WordPress-hardening pattern, not a gap. `.env`- and `wp-config.php.bak`-shaped requests return `406 Not Acceptable` rather than `404`, strongly suggestive of an active WAF rule (a positive signal, not investigated further as that would mean probing the WAF's own rule set). `wp-config.php` itself, requested directly, returns `200` with an empty body — carefully confirmed this is normal PHP execution producing no output, **not** a source-code leak (no `<?php` tag, no secret-bearing content in the response, verified without ever printing or retaining any actual content). **No new finding beyond DNS-1 above.**

---

## 27. Information Disclosure

Beyond GQLSCHEMA-1 (§8), no new information-disclosure surface was found. Error responses across every route tested this phase and in prior phases (preview auth failures, malformed IDs, WordPress fetch failures) return generic messages with no stack trace, file path, or internal detail — re-confirmed, not re-derived.

---

## 28. Privacy/Tracking

**Genuinely new — live-verified via direct browser inspection, not reasoned from code.** Loaded the homepage and `/contact` in a real browser session and inspected `document.cookie`, `localStorage`, and `sessionStorage` directly in the live page context: **zero cookies, zero localStorage keys, zero sessionStorage keys** on both pages for a normal, non-preview visit. This confirms — empirically, not just by absence-of-analytics-in-`package.json` — that no tracking, no marketing script, and no unexpected client-side storage exists anywhere on the site today. **Nothing to flag for legal/business review: there is no data collection happening to review.** The Draft Mode cookie (already documented in Phase 3) only exists during an active, authenticated preview session — confirmed not present on a normal visit.

---

## 29. Logging/Incident Response

Phase 5's MONITOR-1 (WordPress-save failures in the lead pipeline unlogged) and RESEND-LOG-1 (email failure logs don't identify which email/lead failed) are cited, not re-derived. This phase's genuinely new question:

#### LOG-1 — Failed preview-secret attempts produce zero server-side log trace
- **CATEGORY:** Security Logging / Incident Response. **SEVERITY:** P2.
- **LOCATION:** `src/lib/wordpress/preview-request.ts`'s `isValidPreviewSecret()`, consumed identically by both preview route handlers.
- **EVIDENCE:** `isValidPreviewSecret()` is a pure boolean function with no logging call of any kind on the false-return path. Both route handlers call it and, on failure, immediately return a 401 with zero logging before that return. This is distinct from and additional to MONITOR-1/RESEND-LOG-1, which cover the lead pipeline specifically — this covers preview authentication.
- **VERIFICATION:** Direct source read of all relevant files, confirmed no logging statement exists anywhere on the secret-validation-failure path.
- **ATTACK/FAILURE SCENARIO:** A sustained probing or brute-force attempt against either preview route would produce zero server-side trace — no log line, no count, nothing to alert on or review after the fact. The constant-time comparison and lack of rate limiting already make such an attempt impractical to succeed at (assuming real secret entropy — see BRUTEFORCE-1), so this is a **detectability gap independent of exploitability**: even a single suspicious attempt currently leaves no evidence it ever happened.
- **PRODUCTION IMPACT:** Low likelihood of an actual attack succeeding, but a genuine, currently-total blind spot.
- **CLAUDE CAN FIX?** YES — a one-line log call on the failure path (timestamp, route, explicitly NOT the guessed secret value), consistent with the pattern the codebase already uses for its WordPress-fetch-failure logging one branch below this one in the same files.
- **MANUAL ACTION REQUIRED?** NO for the code fix. (Reviewing Vercel's existing logs for any historical attempts, if ever desired, would be an optional manual action.)
- **RECOMMENDATION:** Add logging on the preview-secret-failure path in both route handlers.

---

## 30. Documentation Security

Beyond Phase 4's DOCS-1/2/3 (stale migration doc, boilerplate README, missing plugin runbook — cited, not re-derived), this phase applied a security-specific lens: could following any existing documentation cause an operator to accidentally expose a credential or misconfigure production? `.env.example` contains no real-looking values that could be mistaken for a working default (confirmed in §4). No documentation anywhere suggests disabling a security control, using a weak/default secret, or committing a real credential "temporarily." The plugin's own doc-comment correctly instructs generating a real Application Password via wp-admin's standard flow. **No new finding** — the one gap found (vague preview-secret generation guidance) is filed as BRUTEFORCE-1 in §12, not duplicated here.

---

## 31. Findings Table

Phase 6 new findings only.

| ID | Category | Severity | Finding | Claude Fix? | Manual? |
|---|---|---|---|---|---|
| DNS-1 | Transport Security | P2 | `cms.tffdigital.com` has no HTTPS enforcement or HSTS | NO | YES (Bluehost) |
| LOG-1 | Security Logging | P2 | Failed preview-secret attempts produce zero log trace | YES | NO |
| GQLSCHEMA-1 | Info Disclosure | P3 | GraphQL "did you mean" leaks schema field/type names | NO | YES (WordPress) |
| BRUTEFORCE-1 | Documentation Hardening | P3 | Vague preview-secret generation guidance | PARTIAL | YES (verify prod value) |
| VERCEL-1 | Deployment Config | INFO | Preview-vs-Production env var scoping unverifiable | NO | YES (Vercel dashboard) |
| CLICKJACK-1 | Clickjacking | INFO | CMS general pages lack frame headers (sensitive page has them) | NO | NO |
| CORS-GQL-1 | CORS | INFO | Wildcard CORS on GraphQL, safe combination | N/A | NO |

**7 new findings: 0 P0 · 0 P1 · 2 P2 · 2 P3 · 3 INFO.**

---

## 32. Claude-Fixable

**LOG-1** (add logging on the preview-secret-failure path). **BRUTEFORCE-1**, partially (strengthen `.env.example`'s guidance — the production-value verification itself is not Claude-fixable).

---

## 33. Manual/User Required

**DNS-1** (Bluehost-side HTTPS redirect + HSTS for the CMS domain). **GQLSCHEMA-1** (WordPress/WPGraphQL-side error-formatter change, optional). **BRUTEFORCE-1** (confirm the actual production preview secret has real entropy). **VERCEL-1** (verify env-var Environment scoping in the Vercel dashboard).

---

## 34. Business/Legal Decision

None this phase. §28's privacy audit found zero data collection to review — there is no tracking/consent question requiring a business or legal decision, since nothing is currently being collected.

---

## 35. Unknown / Not Verifiable

- Whether the actual production `WORDPRESS_PREVIEW_SECRET` has real entropy — this repository only has access to the empty local placeholder.
- Whether Vercel's dashboard currently scopes credential env vars to Production-only or also exposes them to Preview deployments (VERCEL-1).
- WPGraphQL's actual `first`-parameter query-depth/complexity cap — inconclusive given current content volume is too low to distinguish "no cap" from "an irrelevantly-high cap."
- Whether any historical failed preview-auth attempt already exists in Vercel's logs (LOG-1 identifies the gap going forward; retrospective review would need dashboard access).

---

## 36. Already Secure / Correct

Empirically confirmed this phase, not just assumed: WPGraphQL's `asPreview` mechanism is independently authenticated, providing genuine defense-in-depth beyond the app's own secret gate (§8); zero secrets have ever existed in this repository's git history, across all 69 commits (§6); production JS bundles contain zero leaked credentials or paths, and source maps are correctly blocked at the platform level (§24); no open-redirect surface exists anywhere in the codebase, confirmed by an exhaustive sweep (§13); no cookies or client-side storage exist for a normal visitor, confirmed by live browser inspection (§28); the contact form's response shape never echoes submitted PII back to the client (§10); every missing-environment-variable path fails safely, most fail closed (§5); zero install-time supply-chain scripts exist among any dependency (§22); the WordPress admin surface follows standard, expected hardening patterns with signs of an active WAF (§26). Combined with every prior phase's already-verified security posture (headers, CSP, the mshots SSRF guard, constant-time preview-secret comparison, WordPress's own REST/XML-RPC standard-default posture), this is a genuinely well-built system from a security standpoint.

---

## 37. Recommended Phase 7

Six phases have now covered architecture, SEO, security/performance/accessibility, content/functionality, resilience, and — this phase — dedicated deep security across secrets, infrastructure, and privacy. Very little unexplored ground remains that a read-only audit can reach. What's left is exactly what Phases 4, 5, and 6 have each independently converged on recommending: **live, human-in-the-loop verification of the small, specific set of things only a credentialed operator can check** — the actual Vercel dashboard's environment-variable scoping (VERCEL-1) and function/log history; the actual production preview secret's strength (BRUTEFORCE-1); one real contact-form test submission to finally close FORM-1/LEAD-1/MONITOR-1 together; and, if ever prioritized, a WordPress-admin-side hardening pass covering the several already-tracked ACCEPTABLE-BUT-HARDENABLE items (XML-RPC, user enumeration, the GraphQL schema-suggestion leak) that are real but consistently low-severity across every phase that's touched them. A dedicated "Phase 7: credentialed verification and WordPress-admin hardening pass" would be the natural close to this audit series — further read-only phases from here would mostly re-tread already-well-covered ground.

---

## FINAL CHECK

1. `git status`: 11 pre-existing unstaged `docs/*.md` deletions (unchanged since Phase 3, disclosed there and in every phase since, not touched this phase) + this session's `PHASE_1` through `PHASE_5` reports + `docs/TFF_DIGITAL_MASTER_AUDIT.md`, all untracked, none created or modified by Phase 6 except this new report.
2. **No files modified.**
3. **No configuration modified.**
4. **No WordPress settings/content modified.**
5. **No Vercel settings modified.**
6. **No packages installed/updated.**
7. **No deployment occurred.**
8. **No credentials were exposed in this report** — every finding above names variables, files, and exposure classifications only; no secret value appears anywhere in this document.

**NEW FINDINGS:**
P0: 0
P1: 0
P2: 2 (DNS-1, LOG-1)
P3: 2 (GQLSCHEMA-1, BRUTEFORCE-1)
INFO: 3 (VERCEL-1, CLICKJACK-1, CORS-GQL-1)

**CLAUDE-FIXABLE:** LOG-1, BRUTEFORCE-1 (partial)
**MANUAL:** DNS-1, GQLSCHEMA-1, BRUTEFORCE-1 (production-value verification), VERCEL-1
**BUSINESS DECISION:** None
**UNKNOWN:** Production preview-secret entropy; Vercel env-var Environment scoping; WPGraphQL's real query-depth cap; historical preview-auth-failure log entries

1. **What is already secure/correct:** the `asPreview` authentication boundary (independently confirmed, genuine defense-in-depth); the entire git history (never contained a secret); production JS bundles and source-map handling; the open-redirect surface (none exists); live cookie/privacy posture (zero data collection); the lead pipeline's PII-handling response shape; every environment variable's missing-config failure mode; dependency supply-chain install-script surface; and everything already confirmed secure across the five prior phases.
2. **What actually requires fixing:** nothing rises to a confirmed vulnerability. The two P2s (DNS-1, LOG-1) are real gaps worth closing but neither has a demonstrated or realistic active exploitation path today.
3. **What only requires hardening:** GQLSCHEMA-1 (WordPress-side GraphQL error formatting) and CLICKJACK-1 (informational, already-covered sensitive surface) are optional defense-in-depth, not defects.
4. **What requires manual action:** DNS-1 (Bluehost HTTPS/HSTS config), VERCEL-1 (Vercel dashboard env-var scoping check), BRUTEFORCE-1 (confirm production secret strength).
5. **What requires a business/legal decision:** nothing this phase.
6. **What should NOT be changed:** WordPress's XML-RPC/user-enumeration defaults and the leads endpoint's public-by-design auth model are all working as intended — don't "fix" what several phases have now confirmed is an appropriate, deliberate design choice.

**FINAL STATUS:**

**PHASE 6 AUDIT COMPLETE**
**READ-ONLY**
**NO FIXES APPLIED**
**NO COMMIT**
**NO PUSH**
**NO DEPLOY**
