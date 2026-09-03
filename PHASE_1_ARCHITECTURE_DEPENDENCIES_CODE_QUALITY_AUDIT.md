# TFF Digital — Phase 1 Audit: Architecture, Dependencies, Code Quality

**Audit Date:** 2026-09-02
**Scope:** Strict read-only. `src/` architecture, dependency/vulnerability posture, code quality, environment/configuration, and testing coverage. Security-adjacent code-quality issues only — full exploitation-style security testing is explicitly out of scope for this phase.
**Repository State:** `tff-digital @ main`, commit `0ff429c8b1bdfc254c31de6860c972f6f7ee4e91` (2026-09-01 22:29:44 +0530) — unchanged before/after this audit (re-verified, see §11 below).
**Baseline Document:** `docs/TFF_DIGITAL_MASTER_AUDIT.md` (2026-09-01/02), used as the current source of truth and cross-checked, not blindly copied — every carried-forward claim below was independently re-derived against the live repository.
**Methodology:** Four independent research passes (this orchestrating pass + three parallel sub-audits covering baseline/env/testing, full architecture trace, and code-quality/dependencies respectively), each reading source directly or running real commands (`npm run lint`, `npm run build`, `npx tsc --noEmit`, `npm audit`, `npm outdated`, targeted `grep`, and one live read-only GraphQL query). Nothing was fixed, modified, installed, committed, or deployed while producing this document.

---

## 1. Executive Summary

The architecture is genuinely disciplined. Every repository routes exclusively through the shared `fetchGraphQL`/`postToWordPress` helpers, zero GraphQL queries exist outside `src/graphql/`, zero business logic or data-fetching has leaked into UI components, there are zero circular dependencies, `server-only` is applied consistently across the data layer, and — checked file by file across all 53 Client Components — there is **no unnecessary `"use client"`** anywhere. `npm run lint`, `npx tsc --noEmit`, and `npm run build` all pass clean (25 routes, 0 errors). No hardcoded secrets exist anywhere. This confirms the master audit's positive architecture assessment rather than overturning it.

**No new P0s.** The one pre-existing P1 (**ARCH-1**, hardcoded Services listing/homepage) is confirmed still present, unchanged, and correctly gated on WordPress content cleanup — not a code defect, not new scope.

**Two things this pass adds or corrects that the master audit didn't fully capture:**

1. **The master audit's claim of "Zod schemas at every external boundary" is only half true.** Zod is used in exactly one file in the entire data layer — the contact-form *input* boundary. None of the 8 repositories, their adapters, or their services validate the *shape* of WordPress GraphQL/REST responses at runtime; two network responses are cast directly to their expected TypeScript type with zero runtime check (**CQ-1**, P2).
2. **Zero HTML sanitization exists anywhere in the project.** WordPress-authored rich-text content (blog posts, case-study challenge/solution fields, service descriptions) is rendered via `dangerouslySetInnerHTML` with no sanitizer library in `package.json` at all — a deliberate, code-commented trust-boundary decision, but one that compounds directly with the master audit's own SEC-2 (enumerable "admin" username) and CMS-3 (live XML-RPC brute-force surface): if the WordPress admin account is ever compromised via either of those already-known, already-unaddressed vectors, this is an immediate site-wide stored-XSS pipeline across every blog post, case study, and service page (**ARCH-5**, P2).

**One master-audit open question resolved this pass:** the master audit left it unconfirmed whether WPGraphQL's `menus` field still rejects `MenuLocationEnum: PRIMARY` (the blocker behind **ARCH-4**, the dormant navigation layer). A single unauthenticated, read-only GraphQL query re-run today (2026-09-02) confirms it is **still rejected** — `"Value \"PRIMARY\" does not exist in \"MenuLocationEnum\" enum."` — so ARCH-4 is confirmed blocked at the WordPress schema level, not merely unwired in code.

**Scorecard (this phase's scope only):** 0 P0 · 1 P1 · 6 P2 · 8 P3 · 3 INFO.

---

## 2. Baseline

| Item | Value | Status |
|---|---|---|
| Branch | `main` (tracking `origin/main`) | VERIFIED |
| HEAD | `0ff429c8b1bdfc254c31de6860c972f6f7ee4e91` — 2026-09-01 22:29:44 +0530 | VERIFIED |
| Working tree | 9 unstaged deletions under `docs/` (superseded audit docs, consistent with the master audit's own cleanup-log framing) + 1 untracked `docs/TFF_DIGITAL_MASTER_AUDIT.md`. Nothing else modified or staged. Left untouched throughout. | VERIFIED |
| Next.js | `15.5.22` exact-pinned in `package.json`; installed version matches | VERIFIED |
| React / React DOM | `19.1.0` / `19.1.0`, exact-pinned; installed matches | VERIFIED |
| TypeScript | `^5` in `package.json`; installed `5.9.3` | VERIFIED |
| Node (local) | `v26.7.0` — the machine this audit ran on, not necessarily Vercel's build runtime | VERIFIED (local only) |
| npm | `11.19.0` | VERIFIED |
| Package manager | npm — `package-lock.json` present (231KB); no yarn/pnpm/bun lockfile found | VERIFIED |
| Production ↔ repo alignment | Not independently re-verified live this pass (out of scope for a repo-focused audit). The master audit live-verified production against this exact HEAD SHA one day prior (2026-09-01) and found it matching everywhere checked; HEAD has not moved since. The alignment claim is carried forward on that basis, not freshly re-confirmed. | PARTIALLY VERIFIED (carried forward) |

---

## 3. Architecture Assessment

**Intended pipeline:** GraphQL/REST → Repository → Adapter → Service → App Router/Page, with Zod validation and `server-only` guards at the boundary.

**Verified clean, no findings (stated for completeness, each independently checked against current source):**

- All 8 repositories (`src/repositories/*.ts`) route exclusively through `fetchGraphQL` or `postToWordPress` — zero bypass found. All declare `import "server-only"`.
- Zero `gql`/GraphQL template literals exist outside `src/graphql/`.
- `process.env` access is confined to `src/config/`, with exactly one deliberate-but-inconsistent exception (**ARCH-7** below).
- `src/components` and `src/sections` have zero imports of `@/repositories`, `@/services`, or `@/lib/wordpress`, and zero `useEffect`+`fetch` patterns — no business logic or client-side data-fetching leaked into UI.
- Every `src/app/**/page.tsx` and route handler imports only `@/services`, never `@/repositories` directly — full pipeline discipline maintained end to end.
- Zero circular dependencies: adapters form a clean DAG (`media`/`author`/`taxonomy` are leaves; `seo` depends on `media`; composite adapters depend only on leaves + `seo`); repositories never import each other; the one service→service edge (`contact.service` → `email.service`) is one-directional.
- `server-only` is consistently declared on every repository, service, `lib/wordpress/*`, `lib/email/*`, `lib/seo/sitemap.ts`, and all 3 preview route handlers; correctly *absent* from adapters/types (they hold no secrets and are safe on either boundary).
- Every `"use client"` component with "no obvious interactivity" was individually checked (`Button`/`Input`/`Select`/`Textarea`, `RelatedServices.tsx`, `ServicesGrid.tsx`) and has legitimate justification — shared primitives must stay client to safely accept event-handler props from any caller, and two sections resolve non-serializable Lucide icon references client-side (one with an explicit comment explaining why). **No unnecessary `"use client"` found anywhere.**
- 53 of 225 `.ts`/`.tsx` files are Client Components (~24%); zero of them import the WordPress lib/repository/service layer directly — no accidental client-side data fetching.
- Error handling is genuinely consistent: every WordPress fetch path throws a typed `WordPressError` with a `kind` discriminant (`config`/`network`/`http`/`parse`/`graphql`), reused uniformly by every repository — not a finding, a strength.
- No route-level `export const revalidate` exists anywhere (by design — `fetchGraphQL`'s own default, `client.ts:50`, `options?.next ?? { revalidate: 60 }`, drives Next's inferred ISR window per fetch call instead; confirmed against build output's `1m` revalidate column). WORKING AS DESIGNED.

The dormant/incomplete layers below are the actual substance of this section.

---

## 4. Architecture Findings

#### ARCH-1 — Services listing/homepage hardcoded despite a live WordPress detail route
- **Category:** Architecture / incomplete migration
- **Priority:** P1
- **Status:** VERIFIED — CONFIRMED STILL PRESENT, unchanged from master audit
- **Evidence:** `src/data/temporary-services.ts:1-13` (explicit comment marking this as an intentional, temporary placeholder); `src/app/page.tsx:38,43-45,51` and `src/app/services/page.tsx:6,68` carry commented-out WordPress restore paths and `TODO: RESTORE WORDPRESS DATA` markers; `/services/[slug]` already fetches and renders live WordPress data via the fully-built `service-offering.repository/adapter/service.ts` stack.
- **Impact:** The `/services` listing and homepage services grid show stale hardcoded copy while the detail page one click away already renders live (if editorially messy) WordPress content — an inconsistent, half-migrated experience, and it keeps all 7 real WordPress Service entries undiscoverable from navigation.
- **Recommendation:** Deliberate incomplete migration, correctly gated on WordPress content cleanup (master audit CMS-9). Flip the 5 tracked TODOs once service copy is clean — the fetch/adapter/service code path already exists and is already proven live by the detail route.
- **Effort:** Low (code side already built; work is deleting the hardcoded array and wiring the existing service once content is ready).
- **Risk:** Low — existing, already-proven pattern.

#### ARCH-2 — Dormant "Portfolio" integration layer, real WordPress content behind it
- **Category:** Architecture / dormant feature
- **Priority:** P2
- **Status:** VERIFIED — CONFIRMED STILL PRESENT, unchanged
- **Evidence:** `grep -rl "portfolio" src/app src/sections src/components` → zero hits. Full stack intact and unwired: repository, service, adapter, GraphQL query, domain/API types. Master audit independently confirmed the WordPress `projects` CPT has 6 published entries behind it.
- **Impact:** Real, ready-to-publish WordPress content (6 projects) is unreachable from the live site; meanwhile the built code represents carrying cost with zero current payoff.
- **Recommendation:** Not a code defect — a product decision. Either build the `/projects` route (the data layer is fully ready) or consciously decide not to and leave it as documented future-ready infrastructure.
- **Effort:** Low-Medium to activate (route + listing/detail pages on top of an already-complete data layer); zero effort to leave as-is.
- **Risk:** Low either direction.

#### ARCH-3 — `WORDPRESS_USE_MOCK_DATA` silently overrides a configured real endpoint
- **Category:** Architecture / configuration safety
- **Priority:** P2
- **Status:** VERIFIED — CONFIRMED STILL PRESENT, mechanics unchanged
- **Evidence:** `src/config/wordpress.config.ts:8-9` — `useMockData: process.env.WORDPRESS_USE_MOCK_DATA === "true" || graphqlEndpoint === ""`. The literal string `"true"` always wins even when a real GraphQL endpoint is also configured. Consumed via a consistent `if (wordpressConfig.useMockData) {...}` guard at the top of every relevant service function (21 call sites across `src/services/*.ts`, spot-checked in `case-study.service.ts:39,73,89,108`).
- **Impact:** Harmless in local dev; if this exact string were ever pasted into Vercel's **Production** environment by mistake, the live site would silently start serving mock content with no error surfaced anywhere.
- **Recommendation:** Add a guarding code comment at the definition site; separately confirm the variable is unset (or explicitly `"false"`) in Vercel Production — a dashboard check, not a code change.
- **Effort:** Trivial (one comment) for the code-side mitigation.
- **Risk:** None for the comment; the actual exposure is a Vercel dashboard configuration question, not a code risk.

#### ARCH-4 — Dormant navigation layer; WordPress schema confirmed still blocking it
- **Category:** Architecture / dormant feature
- **Priority:** P3
- **Status:** VERIFIED — CONFIRMED STILL PRESENT + new live evidence resolves a prior open question
- **Evidence:** `grep -rln "navigation.repository\|navigation.service\|getNavigationMenu" src/app src/sections src/components` → zero hits; `Navbar.tsx:12` / `Footer.tsx:20` hardcode their own `navLinks`/`footerLinks` arrays. **New this pass:** a single unauthenticated, read-only GraphQL query matching `navigation.queries.ts`'s exact shape (`location: "PRIMARY"`, matching `WP_MENU_LOCATIONS.primary` in `src/constants/content-types.ts:10`) was run live against `cms.tffdigital.com/graphql` on 2026-09-02. Result: `"Value \"PRIMARY\" does not exist in \"MenuLocationEnum\" enum."` — still rejected today. Introspection remains disabled for public requests (consistent with master audit), so the actual valid enum values were not enumerated.
- **Impact:** None currently — 7 nav links and a 3-column footer are cheap to hardcode. This confirms the dormancy is a genuine WordPress-schema blocker, not just an unwired frontend.
- **Recommendation:** Keep as-is unless CMS-driven navigation becomes an actual goal; if it ever does, the WordPress-side menu-location registration needs fixing first (outside this repo's control), not the frontend code.
- **Effort:** N/A (WordPress-side blocker, not a frontend task).
- **Risk:** None — no user-facing effect either way.

#### ARCH-5 — Zero HTML sanitization on WordPress rich-text content
- **Category:** Architecture / security-adjacent code quality
- **Priority:** P2
- **Status:** VERIFIED — new finding, most significant of this pass
- **Evidence:** `src/components/blog/ArticleContent.tsx:66` — `dangerouslySetInnerHTML={{ __html: html }}` with no sanitizer anywhere in the path. Full-repo check confirms no DOMPurify, `sanitize-html`, or `xss` package exists in `package.json` or `src/` (the only "sanitize" hit, `src/lib/email/sanitize.ts`, is unrelated email-header escaping, already covered by master audit SEC-6). The adapters feeding this component (`case-study.adapter.ts:35,42-43` for `content`/`challenge`/`solution`, `service-offering.adapter.ts:16` for `content`, `post.adapter.ts:15,23` for `content`) apply a bare `?? ""` default with zero transformation — raw WordPress-authored HTML passes straight through. `ArticleContent` is reused across three content types: `src/app/blog/[slug]/page.tsx:165`, `src/app/case-studies/[slug]/page.tsx:179,187`, `src/app/services/[slug]/page.tsx:115`. The component's own styling explicitly supports `<iframe>` embeds. A code comment (lines 12-14) documents this as a deliberate choice: "content comes from the CMS, not user input, same trust boundary as JsonLd."
- **Impact:** Sound today because only trusted wp-admin staff author this content — but this is the *one* external-data boundary in the entire codebase with zero validation of any kind, and it directly compounds two already-known, already-unaddressed WordPress attack surfaces from the master audit: SEC-2 (the "admin" username is publicly enumerable via REST) and CMS-3 (XML-RPC is live with `system.multicall`, a fast wp-admin credential brute-forcing vector). If either of those is ever successfully exploited, this finding is what turns that WordPress compromise into an immediate, site-wide stored-XSS pipeline across every blog post, case study, and service page — a materially larger blast radius than either precondition finding carries on its own.
- **Recommendation:** Add an HTML sanitizer (e.g. `isomorphic-dompurify` or `sanitize-html`, server-side before render) in the adapter layer where `content`/`challenge`/`solution` fields are mapped, with an explicit allowlist that still permits the `<iframe>` embeds the component is styled for. Not urgent in isolation, but should be tracked alongside — not independently of — SEC-2/CMS-3, since fixing the sanitizer is cheap insurance against those two already-open doors.
- **Effort:** Low-Medium — one shared sanitization step in the adapter layer, applied to 3-4 field mappings across 3 adapters.
- **Risk:** Low — sanitizer libraries are mature and this is an additive change; the only care needed is preserving the `<iframe>` allowlist the component already depends on.

#### ARCH-6 — Contact email/phone duplicated as literals across 4 files
- **Category:** Architecture / code duplication
- **Priority:** P3
- **Status:** VERIFIED — new finding; PARTIALLY RESOLVES the "duplicated contact configuration" cross-check item
- **Evidence:** `info@tffdigital.com` / `+91 72068 09816` are hardcoded independently in `src/sections/contact/ContactFormSection.tsx:18-19`, `src/sections/legal/PrivacyPolicyBody.tsx:153`, `src/sections/legal/TermsBody.tsx:122`, and `src/components/layout/Footer.tsx:132-139` — 4 files, no shared constant. By contrast, `SOCIAL_LINKS` (`src/constants/social.ts`) establishes exactly this single-sourcing pattern one constant file away, with 3 consumers correctly importing from it.
- **Impact:** Values are currently consistent everywhere (the master audit's §13 "conflicting contact info" issue stays genuinely fixed) — but the underlying duplication was never structurally eliminated, so a future edit has 4 places to remember instead of 1, and nothing would catch a future drift.
- **Recommendation:** Add `CONTACT_INFO` (email/phone) to `src/constants/`, matching the `SOCIAL_LINKS` pattern already established, and point all 4 sites at it.
- **Effort:** Trivial — one new constant, 4 one-line import swaps.
- **Risk:** None.

#### ARCH-7 — Preview-auth credentials bypass the config layer
- **Category:** Architecture / configuration consistency
- **Priority:** P3
- **Status:** VERIFIED — new finding, independently cross-validated by two separate audit passes
- **Evidence:** `src/lib/wordpress/preview-auth.ts:15-16` reads `process.env.WORDPRESS_PREVIEW_USERNAME`/`WORDPRESS_PREVIEW_APP_PASSWORD` directly, while its sibling secret `WORDPRESS_PREVIEW_SECRET` is correctly centralized in `src/config/preview.config.ts:8`.
- **Impact:** None functionally — the file still declares `import "server-only"` (line 1) and the values are still correctly gated. Purely a "single place for all env access" pattern inconsistency versus the rest of `src/config/`.
- **Recommendation:** Move both reads into `src/config/preview.config.ts` alongside `WORDPRESS_PREVIEW_SECRET`.
- **Effort:** Trivial.
- **Risk:** None.

#### ARCH-8 — Preview route handlers duplicate control flow
- **Category:** Architecture / minor duplication
- **Priority:** P3
- **Status:** VERIFIED — new finding
- **Evidence:** `src/app/api/preview/case-study/route.ts` and `src/app/api/preview/service/route.ts` repeat near-identical ~20-line control flow (secret validation → id parsing → try/catch → `draftMode().enable()` → redirect).
- **Impact:** Minor maintenance cost only — each correctly delegates actual business logic to its own service function, so this is thin-controller duplication, not a service-logic violation.
- **Recommendation:** Optional: extract the shared control flow into one helper parameterized by content type. Low value given there are only 2 call sites today.
- **Effort:** Low.
- **Risk:** None.

#### ARCH-9 — Three zero-consumer components (dead or future-ready, undetermined)
- **Category:** Architecture / dormant code
- **Priority:** P3
- **Status:** VERIFIED presence; classification requires a product decision, not further code investigation
- **Evidence:** `src/components/blog/PostCardSkeleton.tsx` and `src/components/common/LoadingState.tsx` — both loading-UI primitives, zero consumers (confirmed by grep), plausibly built in anticipation of `loading.tsx` route files, which the master audit's PERF-3 confirms don't exist anywhere in the route tree — best classified as **future-ready infrastructure**. `src/components/common/AutoRotatingImage.tsx` — a self-contained crossfading image carousel, zero consumers, no explanatory comment; possibly orphaned from an earlier design iteration (e.g. the `TrustedBrands.tsx` rewrite documented in master audit §13), but this is speculation, not confirmed either way.
- **Impact:** None currently — dead weight in the bundle only if not tree-shaken (Next.js correctly excludes unreferenced components from the client bundle either way).
- **Recommendation:** Do not delete without a decision. If `loading.tsx` files are ever added (tracked as master-audit PERF-3), `PostCardSkeleton`/`LoadingState` are likely exactly what they're for. `AutoRotatingImage.tsx`'s fate is a genuine open question — worth one direct question to whoever owns design history, not a unilateral deletion.
- **Effort:** N/A (decision, not implementation).
- **Risk:** Low either way; flagged per this audit's explicit instruction not to recommend deletion solely for having zero current consumers.

---

## 5. Code Quality Assessment

**Command results (all read-only, all re-run fresh this pass):**

| Check | Result |
|---|---|
| `npm run lint` | **PASS** — "ESLint: No issues found" |
| `npx tsc --noEmit` | **PASS** — zero type errors, strict mode |
| `npm run build` | **PASS** — 25 routes generated, 0 errors. Confirms build-output shape unchanged from master audit (`/`, `/blog/[slug]`, `/case-studies/[slug]` are SSG/ISR with a 1-minute revalidate window; `/services/[slug]`, `/case-studies`, `/blog` remain fully dynamic with no revalidate window — independently reconfirms master-audit PERF-1). |

**Clean, no findings (checked directly, stated for completeness):**

- Zero explicit `: any` or `as any` annotations anywhere in `src/`.
- 17 `console.error` calls exist, and every single one sits inside a catch block as deliberate error-path logging (`global-error.tsx:16`, `error.tsx:18`, both preview route handlers, `contact/actions.ts:42`, `lib/seo/sitemap.ts:47,65`, `taxonomy.service.ts:30,52`, `case-study.service.ts:62`, `email.service.ts:25`, `post.service.ts:73,102,122,150`, `service-offering.service.ts:48`). **Zero `console.log`/`.debug` leftovers found.**
- Exactly **7** `TODO: RESTORE WORDPRESS DATA` markers across **5** files — `src/sections/home/WhatWeDo.tsx:25`, `src/app/page.tsx:38`, `src/app/services/page.tsx:6,68`, `src/lib/seo/sitemap.ts:8,74`, `src/data/temporary-services.ts:8` — confirmed by two independent passes, exact match to the master audit, one consistent theme (all tied to ARCH-1). Zero `FIXME`/`HACK` markers found anywhere.
- Component size is reasonable: the two largest files by line count are `components/team/TeamCarousel.tsx` (340 lines) and `components/testimonials/TestimonialSlider.tsx` (329 lines) — plausible given carousel/drag/viewport-tracking logic, not flagged without evidence of actual internal duplication.

#### CQ-1 — Zod validation is not applied at the WordPress response boundary
- **Category:** Code quality / data validation
- **Priority:** P2
- **Status:** VERIFIED — new finding; corrects the master audit's executive-summary claim
- **Evidence:** `from "zod"` appears in exactly **one** file across the entire data/service layer — `src/features/contact/actions.ts` (the contact-form *input* boundary). Zero of the 8 repository files, their adapters, or their services import `zod`. Every WPGraphQL/REST response is instead trusted via a direct generic-type cast with no runtime shape check: `src/lib/wordpress/client.ts:84` — `(await response.json()) as GraphQLResponse<TData>` — and `src/lib/wordpress/rest-client.ts:49` — `(await response.json()) as TResponse` — both check only that `.data`/`.errors` exist, never their internal shape. (`src/adapters/seo.adapter.ts:19`'s `JSON.parse(raw) as Record<string, unknown>` is a separate, defensible case — wrapped in try/catch, degrades to `null`, and its source is Yoast's own CMS-generated schema string, not arbitrary input.)
- **Impact:** The master audit's own line "Zod schemas at every external boundary" (§2) is accurate only for the contact-form input direction. A WPGraphQL schema change, a plugin update, or a manual WordPress field edit that renames or nulls a field would not surface as the same clean, typed `WordPressError` every other WordPress failure mode produces — it would either silently propagate `undefined` into a component or throw an unrelated, harder-to-diagnose runtime `TypeError`. Not an exploitable vulnerability — WordPress is a trusted first-party CMS here, not attacker-controlled input — but a real robustness blind spot in an otherwise carefully-typed error-handling architecture.
- **Recommendation:** Add Zod schemas at the repository or adapter layer for at least the highest-traffic response shapes (case study, service, post), reusing the existing typed-error pattern (`WordPressError` already has a `kind: "parse"` case that fits naturally).
- **Effort:** Medium — one schema per content type (≈6-8 shapes), applied at a single, well-defined seam per repository.
- **Risk:** Low — purely additive; a mis-specified schema would fail loud in development rather than introduce new risk.

#### CQ-2 — Three of four server-only config files lack a `server-only` import guard
- **Category:** Code quality / defense-in-depth
- **Priority:** P3
- **Status:** VERIFIED — new finding
- **Evidence:** Of the four files holding server-only secrets/config (`src/config/email.config.ts`, `src/config/wordpress.config.ts`, `src/config/preview.config.ts`, `src/lib/wordpress/preview-auth.ts`), only `preview-auth.ts` imports the `server-only` package (line 1). The other three have no such guard.
- **Impact:** No active leak — non-`NEXT_PUBLIC_` env vars already resolve to `undefined`/empty in client bundles under Next's own env-inlining rules, and a direct grep confirms no `"use client"` file currently imports any of these three files anyway. The gap is the *absence of a fail-fast build error* if that mistake is ever made in the future, unlike `preview-auth.ts` which would hard-fail immediately.
- **Recommendation:** Add `import "server-only";` as the first line of all three files, matching `preview-auth.ts`.
- **Effort:** Trivial — one import line × 3 files.
- **Risk:** None.

#### CQ-3 — `REQUEST_TIMEOUT_MS` declared twice independently
- **Category:** Code quality / minor duplication
- **Priority:** P3
- **Status:** VERIFIED — new finding
- **Evidence:** `REQUEST_TIMEOUT_MS = 8_000` is declared separately in `src/lib/wordpress/client.ts:28` and `src/lib/wordpress/rest-client.ts:8`. Both carry a comment cross-referencing the other ("Same ceiling as the GraphQL client"), so the duplication is acknowledged, not accidental.
- **Impact:** None today — purely a two-edit-sites-for-one-value maintenance nit.
- **Recommendation:** Optional: hoist to one shared constant in `src/config/` or `src/lib/wordpress/constants.ts`.
- **Effort:** Trivial.
- **Risk:** None.

**Zod/serialization/HTML-rendering security-adjacent items** are covered under ARCH-5 and CQ-1 above rather than repeated here.

---

## 6. Dependency Audit

**`npm audit` — 4 HIGH, 0 CRITICAL. Confirmed unchanged from the master audit's DEP-1 (same shape, same packages, no drift):**

| Package | Advisory | Direct/Transitive | Fix Path | Exploitable Here? | Recommendation |
|---|---|---|---|---|---|
| `nanoid <3.3.18` | GHSA-2v37-7h3g-55p8 — indefinite loop when size is zero | Transitive, via `next`'s own internal tooling | Standalone `npm audit fix` — non-breaking, isolated | Low — invoked by Next's internal tooling, not application-controlled input | **Fix now** — free, isolated, zero reason to defer |
| `postcss ≤8.5.22` | 4 advisories: XSS via unescaped `</style>` output, 2× `sourceMappingURL` path-traversal/info-disclosure, 1 incomplete-fix follow-up | Transitive, bundled inside `next`'s own `postcss` | Requires `npm audit fix --force` → `next@16.3.4` (breaking) | Low in this app's actual usage — postcss runs at **build time** over this project's own trusted Tailwind/CSS source, never over attacker-controlled CSS at runtime | **Defer** — bundle with the already-tracked Next 16 upgrade |
| `sharp <0.35.0` | 4 inherited libvips CVEs (CVE-2026-33327/33328/35590/35591) | Transitive, via `next/image`'s optimizer | Same — requires Next 16 | Low — `images.remotePatterns` is a tight, explicit allowlist (WordPress media host, Gravatar, mshots, mock-placeholder host only); sharp only ever processes images from those known hosts | **Defer** — same reasoning, same upgrade path |
| `next` (wrapper) | Flagged only as a pass-through of the above | Direct | Resolved automatically by the Next 16 upgrade | N/A | Resolves as a side effect |

#### DEP-1 — 4 HIGH npm audit vulnerabilities, 2 of 3 packages gated behind a Next.js major upgrade
- **Category:** Dependencies / security
- **Priority:** P2
- **Status:** VERIFIED — CONFIRMED UNCHANGED from master audit
- **Evidence:** Table above; full advisory IDs preserved, not summarized away.
- **Impact:** Low real-world exploitability given this project's specific usage of each package (build-time-only postcss, allowlisted-source-only sharp), but genuine HIGH-severity CVEs nonetheless.
- **Recommendation:** Run the isolated `nanoid` fix immediately (zero risk). Schedule postcss/sharp resolution as part of the already-tracked, deliberate Next.js 15→16 planning effort (master audit §22 item 4) — not a drive-by dependency bump.
- **Effort:** Nanoid: trivial. Postcss/sharp: large (tied to a full major-framework upgrade, out of scope to estimate here).
- **Risk:** Nanoid: none. Postcss/sharp: deferring carries low risk given the exploitability analysis above; upgrading carries the inherent risk of any Next.js major version bump (separate from this audit's scope to assess).

#### DEP-2 — Zero automated test coverage anywhere in the repository
- **Category:** Dependencies / testing
- **Priority:** P2
- **Status:** VERIFIED — CONFIRMED UNCHANGED. See §8 for full detail.
- **Evidence:** No Jest/Vitest/Playwright/Cypress config anywhere; no `*.test.*`/`*.spec.*` files anywhere; no `test` script in `package.json`.
- **Impact:** Lint, typecheck, and build are the *only* automated correctness signals in this repository.
- **Recommendation:** Scaffold tests starting with the highest-risk paths (preview auth, lead pipeline, WordPress adapters).
- **Effort:** Medium-High (new tooling + initial test-suite investment).
- **Risk:** None — purely additive.

#### DEP-3 — Next.js and TypeScript version drift (scope widened this pass)
- **Category:** Dependencies / maintenance
- **Priority:** P3
- **Status:** VERIFIED — CONFIRMED, but the master audit's framing ("each one major version behind") is out of date; corrected below
- **Evidence — `npm outdated`, full listing:**

| Package | Current | Latest | Gap |
|---|---|---|---|
| `next` | 15.5.22 | 16.3.4 | 1 major |
| `typescript` | 5.9.3 | 7.0.2 | **2 majors** (5→6→7) — was reported as 1 major behind in the master audit; no longer accurate |
| `eslint` | 9.39.5 | 10.9.1 | 1 major — not previously named |
| `eslint-config-next` | 15.5.22 | 16.3.4 | 1 major (tied to `next`) |
| `framer-motion` | 12.43.0 | 13.1.1 | 1 major — not previously named |
| `@types/node` | 20.19.43 | 26.4.1 | 1 major, large version jump — not previously named |
| `@eslint/eslintrc`, `@hookform/resolvers`, `@types/react-dom`, `highlight.js`, `lucide-react`, `react`, `react-dom`, `react-hook-form`, `resend`, `zod` | — | — | minor/patch only |

- **Impact:** Routine maintenance drift, no active exploit tied to any package specifically named here beyond what's already covered in DEP-1.
- **Recommendation:** Routine maintenance pass; TypeScript's 2-major gap is worth prioritizing over the others given how much of the type-checking safety net depends on it, but none of this is urgent.
- **Effort:** Low-Medium per package (except the Next.js major, already covered under DEP-1).
- **Risk:** Low, standard version-bump risk.

---

## 7. Environment/Configuration Assessment

**Coverage is a perfect 1:1 match, both directions.** `.env.example` declares exactly 12 variables; a repo-wide sweep for `process.env.[A-Z_]+` in `src/` finds exactly those same 12 names, each referenced exactly once. Zero undocumented variables in code, zero documented-but-unused variables in `.env.example`. `.env.local` (git-ignored, confirmed untracked) holds all 12 keys as well.

| Variable | In `.env.example` | Referenced correctly | Location | `NEXT_PUBLIC_`? | Notes |
|---|---|---|---|---|---|
| `WORDPRESS_GRAPHQL_ENDPOINT` | Y | Y | `src/config/wordpress.config.ts:1` | No | server-only |
| `WORDPRESS_REST_URL` | Y | Y | `src/config/wordpress.config.ts:2` | No | server-only |
| `WORDPRESS_MEDIA_HOSTNAME` | Y | Y | `src/config/wordpress.config.ts:7` | No | server-only |
| `WORDPRESS_USE_MOCK_DATA` | Y | Y | `src/config/wordpress.config.ts:9` | No | see ARCH-3 |
| `NEXT_PUBLIC_SITE_URL` | Y | Y | `src/config/site.config.ts:9` | Yes | non-sensitive; safe fallback baked in |
| `NEXT_PUBLIC_SITE_NAME` | Y | Y | `src/config/site.config.ts:5` | Yes | non-sensitive; safe fallback baked in |
| `RESEND_API_KEY` | Y | Y | `src/config/email.config.ts:2` | No | server-only, secret; see CQ-2 |
| `EMAIL_FROM` | Y | Y | `src/config/email.config.ts:3` | No | server-only; see CQ-2 |
| `LEAD_NOTIFICATION_EMAIL` | Y | Y | `src/config/email.config.ts:4` | No | server-only; see CQ-2 |
| `WORDPRESS_PREVIEW_SECRET` | Y | Y | `src/config/preview.config.ts:8` | No | server-only, secret |
| `WORDPRESS_PREVIEW_USERNAME` | Y | Y | `src/lib/wordpress/preview-auth.ts:15` | No | server-only, secret; see ARCH-7 |
| `WORDPRESS_PREVIEW_APP_PASSWORD` | Y | Y | `src/lib/wordpress/preview-auth.ts:16` | No | server-only, secret; see ARCH-7 |

Only 2 `NEXT_PUBLIC_*` variables exist anywhere in the project, and both are non-sensitive. A targeted cross-check (grepping every server-only variable name against every `"use client"`-marked file) found **zero** server-only env var referenced inside a client component — no leak.

No other production-dangerous flags, magic defaults, or fragile config assumptions were found beyond `WORDPRESS_USE_MOCK_DATA` (ARCH-3, already tracked) and the two config-layer consistency nits (ARCH-7, CQ-2).

---

## 8. Testing Assessment

| Check | Result | Status |
|---|---|---|
| Jest/Vitest/Playwright/Cypress config | None found anywhere in the repo | NOT IMPLEMENTED |
| `*.test.*` / `*.spec.*` files | None found anywhere in the repo | NOT IMPLEMENTED |
| Test-related `package.json` scripts | None — full `scripts` block is `dev`, `build`, `start`, `lint`, `format`, `format:check` only | NOT IMPLEMENTED |
| CI configuration (`.github/workflows` or any other) | `.github` directory does not exist at all; no `*.yml`/`*.yaml` CI config anywhere outside `node_modules` | NOT IMPLEMENTED |
| Build/lint/typecheck as the current safety net | `lint` and `build` scripts exist and are runnable; no dedicated `typecheck` script, but `npx tsc --noEmit` works ad hoc since TypeScript is a devDependency. These three are confirmed as the *only* automated correctness signal in the repository. | VERIFIED (configured); WORKING AS DESIGNED as the sole current safety net |

No change from the master audit's DEP-2 finding — confirmed independently via direct filesystem search, not assumed from the prior document.

---

## 9. Cross-Check Against Master Audit

Every item the Phase 1 instructions specifically named for cross-check, re-verified against the current repository rather than copied from the prior text:

| Master Audit Item | This Pass's Verdict | Basis |
|---|---|---|
| **ARCH-2** — dormant Portfolio layer | **CONFIRMED STILL PRESENT**, unchanged | Fresh `grep`, zero consumers; WP `projects` CPT content fact carried forward from master audit's 1-day-old live check |
| **ARCH-3** — mock-data flag | **CONFIRMED STILL PRESENT**, mechanics unchanged | Direct re-read of `wordpress.config.ts:8-9`, same OR-condition logic |
| **ARCH-4** — dormant navigation layer | **CONFIRMED STILL PRESENT** + previously-open question now resolved | Fresh `grep`, zero consumers; **new** live GraphQL re-check today confirms `MenuLocationEnum: PRIMARY` is still rejected by the WordPress schema |
| **Dependency vulnerabilities (DEP-1)** | **CONFIRMED, same shape, no drift** | Fresh `npm audit` run this pass — identical 4 HIGH / 0 CRITICAL, same 3 packages + `next` wrapper |
| **Unsanitized WordPress HTML** | **CONFIRMED, and elevated to a tracked finding (ARCH-5)** — the master audit touched this only tangentially (CMS-6's "renders harmlessly" comment on a leaked editor artifact) without ever naming the sanitization architecture itself as a finding | Full-repo sanitizer-library sweep (none found) + adapter-to-component data-flow trace |
| **Duplicated contact configuration** | **PARTIALLY RESOLVED** — `SOCIAL_LINKS` is genuinely single-sourced (confirmed 3 consumers); email/phone are **not** (ARCH-6, new finding) — though currently consistent in value, so the master audit's §13 "conflicting info" resolution itself still holds | Direct grep across Footer/Contact/Legal sections |
| **Dead scaffolding** (7 TODO markers, 5 files) | **CONFIRMED, exact match**, cross-validated independently by two separate passes | Direct grep, identical file:line list both times |
| **Dead scaffolding** (`MIGRATION_REPORT.md`, dormant Pages layer) | **CONFIRMED STILL PRESENT**, correctly unwired (WORKING AS DESIGNED, matches master audit's own framing) | `content-page.repository/service/adapter` — zero route consumers |
| **Zod "at every external boundary" (master audit §2)** | **SUPERSEDED — the claim requires correction, not just re-confirmation.** Only true for the contact-form input direction; the WordPress response boundary (all 8 repositories) has zero runtime validation (CQ-1, new finding) | Direct import search for `zod` across the entire data/service layer |
| **Plugin v1.4.0 View/Preview (master audit's own "biggest correction")** | Out of scope for this phase (WordPress-plugin/live-behavior verification, not architecture/dependency/code-quality) — not re-litigated here | — |
| **SEO-1, CMS-2, and other SEO/content findings** | Out of scope for this phase by the audit's own instructions (architecture/dependencies/code-quality only) — not re-verified | — |

---

## 10. Prioritized Findings Table

| ID | Category | Priority | Finding | Evidence | Status | Recommended Action |
|---|---|---|---|---|---|---|
| ARCH-1 | Architecture | P1 | Services listing/homepage hardcoded while detail route is live WordPress data | `temporary-services.ts`, live `/services/[slug]` | CONFIRMED | Flip 5 TODOs once WP service copy is clean (content-gated) |
| ARCH-2 | Architecture | P2 | Dormant Portfolio layer maps to a real WP `projects` CPT (6 entries) | `grep` zero consumers | CONFIRMED | Decide: build `/projects`, or leave dormant |
| ARCH-3 | Architecture | P2 | `WORDPRESS_USE_MOCK_DATA` silently wins over a configured endpoint | `wordpress.config.ts:8-9` | CONFIRMED | Add guarding comment; confirm unset in Vercel Production |
| ARCH-5 | Architecture / Security-adjacent | P2 | Zero HTML sanitization on WordPress rich-text content (`dangerouslySetInnerHTML`) | `ArticleContent.tsx:66`, no sanitizer in `package.json` | NEW | Add a server-side HTML sanitizer in the adapter layer |
| CQ-1 | Code Quality | P2 | Zod not applied at the WordPress response boundary (only contact-form input has it) | `zod` imported in exactly 1 file; raw casts in `client.ts:84`, `rest-client.ts:49` | NEW | Add Zod schemas per content type in the repository/adapter layer |
| DEP-1 | Dependencies | P2 | 4 HIGH npm audit vulnerabilities (nanoid, postcss, sharp) | `npm audit` output | CONFIRMED, unchanged | Fix nanoid now; defer postcss/sharp to the tracked Next 16 upgrade |
| DEP-2 | Testing | P2 | Zero automated test coverage anywhere | Direct search, no config/files | CONFIRMED, unchanged | Scaffold tests, starting with preview + lead-pipeline paths |
| ARCH-4 | Architecture | P3 | Dormant navigation layer; WP schema confirmed still rejecting `PRIMARY` | `grep` zero consumers + fresh live GraphQL check | CONFIRMED + new evidence | Keep as-is; low cost either way |
| ARCH-6 | Architecture | P3 | Contact email/phone duplicated as literals across 4 files | `ContactFormSection.tsx`, `PrivacyPolicyBody.tsx`, `TermsBody.tsx`, `Footer.tsx` | NEW | Add a shared `CONTACT_INFO` constant, matching `SOCIAL_LINKS` |
| ARCH-7 | Architecture | P3 | Preview-auth credentials bypass the config layer | `preview-auth.ts:15-16` | NEW | Move into `preview.config.ts` |
| ARCH-8 | Architecture | P3 | Preview route handlers duplicate ~20 lines of control flow | Both `/api/preview/*` routes | NEW | Optional shared helper |
| ARCH-9 | Architecture | P3 | 3 zero-consumer components — future-ready or orphaned, undetermined | `PostCardSkeleton`, `LoadingState`, `AutoRotatingImage` | NEW | Decide intent; do not delete blindly |
| DEP-3 | Dependencies | P3 | Next.js (1 major) + TypeScript (now 2 majors, revised) + eslint/framer-motion/@types-node (1 major each, newly named) behind | `npm outdated` | CONFIRMED, scope widened | Routine maintenance pass |
| CQ-2 | Code Quality | P3 | 3 of 4 server-only config files missing `server-only` import guard | `email.config.ts`, `wordpress.config.ts`, `preview.config.ts` | NEW | Add `import "server-only"` to all 3 |
| CQ-3 | Code Quality | P3 | `REQUEST_TIMEOUT_MS` duplicated in two files | `client.ts:28`, `rest-client.ts:8` | NEW | Optional: hoist to a shared constant |
| INFO-1 | Architecture | INFO | `src/graphql/mutations/` deliberately empty (`.gitkeep` only) | Confirms lead pipeline intentionally uses REST, not a GraphQL mutation | WORKING AS DESIGNED | None |
| INFO-2 | Architecture | INFO | Dormant WordPress Pages layer correctly left unwired | `content-page.*` zero route consumers | WORKING AS DESIGNED | None |
| INFO-3 | Security-adjacent | INFO | Preview-secret constant-time comparison re-verified, unchanged | `preview-request.ts:13-19`, length-check + `timingSafeEqual` | WORKING AS DESIGNED | None |

**P0: 0 · P1: 1 · P2: 6 · P3: 8 · INFO: 3**

---

## 11. Recommended Fix Order

Phase 1 scope only — this doesn't override the master audit's own overall execution order (§25 there), which correctly puts the P0 SEO fix and the P1 lead-pipeline verification ahead of everything in this document.

1. **Quick, zero-risk wins first (batch as one small PR):** `npm audit fix` for nanoid (DEP-1's safe portion); `import "server-only"` on the 3 config files (CQ-2); hoist `REQUEST_TIMEOUT_MS` (CQ-3); add the `CONTACT_INFO` constant (ARCH-6); move preview credentials into `preview.config.ts` (ARCH-7); add the `WORDPRESS_USE_MOCK_DATA` guarding comment (ARCH-3's code-side half). None of these touch behavior.
2. **ARCH-5 (HTML sanitizer)** — worth prioritizing above its P2 peers given it compounds directly with two already-open WordPress attack surfaces (master audit SEC-2, CMS-3); cheap insurance relative to the risk it closes off.
3. **CQ-1 (Zod at the WordPress boundary)** — medium effort, purely additive robustness work; good candidate to pair with any other WordPress-adapter touch-up (e.g., once ARCH-1's services migration is unblocked).
4. **ARCH-1** — proceed once WordPress service content is cleaned up (master audit CMS-9); code path is already built.
5. **ARCH-2, ARCH-9** — product/direction decisions, not implementation work; resolve via a conversation, not a sprint.
6. **DEP-2 (test suite), DEP-1's postcss/sharp half, DEP-3** — schedule around the already-planned Next.js 16 upgrade and normal maintenance cadence.
7. **ARCH-8** — optional, low value given only 2 call sites; skip unless a third preview type is ever added.

---

## 12. Findings NOT Worth Fixing Right Now

- **ARCH-4** — the dormant navigation layer costs nothing to leave hardcoded (7 links, a 3-column footer), and this pass confirmed the WordPress-side blocker is still live — there's nothing productive to do here even if it were prioritized.
- **ARCH-8** — thin-controller duplication across exactly 2 files; a shared helper would be more abstraction than the current 2-call-site reality justifies.
- **ARCH-9's `PostCardSkeleton`/`LoadingState`** — plausible future-ready infrastructure for `loading.tsx` files; deleting now risks re-building the same thing later for no benefit today.
- **CQ-3** — the two `REQUEST_TIMEOUT_MS` declarations already cross-reference each other in comments; the duplication is acknowledged and harmless.

---

## 13. Unknowns / Limitations

- **Live production behavior** was not independently re-verified this pass (repo-focused audit by design); the alignment claim in §2 is carried forward from the master audit's check one day prior, not freshly confirmed.
- **Vercel dashboard environment values** remain unknown from this repository, as in the master audit — whether `WORDPRESS_USE_MOCK_DATA` is actually unset in Production (ARCH-3) can't be confirmed from code alone.
- **Node/npm versions** reported in §2 are the local audit machine's versions, not necessarily Vercel's build runtime.
- **`AutoRotatingImage.tsx`'s origin** (ARCH-9) is speculative — no git-blame or design-history investigation was performed to confirm whether it's future-ready or orphaned.
- **Full security testing** (exploitation, live request fuzzing, auth bypass attempts) is explicitly out of scope for this phase per the audit's own instructions — ARCH-5 and CQ-1 are flagged as code-quality/architecture concerns with security implications, not as a substitute for that dedicated pass.
- **`MIGRATION_REPORT.md`'s content** was not re-read in full this pass beyond confirming its continued existence and the master audit's characterization of it.
- **npm audit / npm outdated** reflect the advisory database and registry state at the moment this audit ran (2026-09-02) — both are living data sources that can shift independently of any code change.

---

## 14. Final Verdict

The codebase remains in genuinely good architectural shape. Pipeline discipline (GraphQL → Repository → Adapter → Service → App) holds with zero exceptions found across the entire `src/` tree; there are no circular dependencies, no unnecessary Client Components, no business logic leaked into UI, and no hardcoded secrets. Lint, typecheck, and build all pass clean. The one P1 (ARCH-1) is pre-existing, correctly understood as content-gated rather than a code defect, and not new scope.

This pass's real contribution is two corrections to how completely the master audit's positive claims apply: the "Zod at every boundary" line is only true in one direction (CQ-1), and the WordPress-HTML trust boundary, while a defensible and clearly-documented choice, has no code-level backstop at all (ARCH-5) — worth tracking precisely because it compounds with two already-known, already-open WordPress attack-surface findings elsewhere in the project. Neither is urgent in isolation; both are cheap to close and worth doing before, not after, either of those WordPress-side vectors is addressed.

Everything else — the dormant Portfolio/navigation layers, the dependency version drift, the handful of small duplication nits — is real, accurately re-confirmed, and exactly as low-stakes as the master audit already assessed it to be.

---

*Phase 1 read-only audit. No files were modified, created, deleted, committed, pushed, or deployed while producing this document, apart from this report itself. No dependencies, environment variables, WordPress configuration, or Vercel configuration were changed. Verified via direct source inspection, real command execution (`npm run lint`, `npm run build`, `npx tsc --noEmit`, `npm audit`, `npm outdated`), targeted `grep` sweeps, and one live, read-only, unauthenticated GraphQL query. STOP — Phase 2 has not been started.*
