# MASTER AUDIT REPORT — PHASES 1–10
## Final Consolidated Report — Single Source of Truth

**Consolidation Date:** 2026-09-02
**This is not a new audit.** This document reads, reconciles, deduplicates, and classifies the findings already produced by the master/baseline audit (`docs/TFF_DIGITAL_MASTER_AUDIT.md`) and Phases 1–10 (all confirmed present on disk before writing this report — see §2). No new investigation was performed. No code, WordPress, Vercel, DNS, or dependency change was made in producing this document.

**The one fact that makes this reconciliation tractable and reliable:** `git HEAD` (`0ff429c8b1bdfc254c31de6860c972f6f7ee4e91`) never moved once across the master audit or any of the ten phases — confirmed via `git status`/`git rev-parse HEAD` after literally every phase in the series, re-confirmed once more before writing this document. Zero commits means zero possibility of drift between any two phases. Where a finding was identified once and never explicitly re-touched by a later phase, this document treats it as still accurate on that basis — not as a guess, but as a direct logical consequence of the codebase being provably unchanged. Where a later phase *did* explicitly re-verify, correct, widen, or resolve an earlier finding, that later evidence wins, per the reconciliation rule this report was asked to apply.

---

## 1. Executive Summary

Ten phases of largely-empirical, read-only auditing (live HTTP/GraphQL testing, real local production builds run against deliberately simulated WordPress outages, downloaded and inspected production JS bundles, a full git-history secret scan, live browser console/keyboard testing) converged on a consistent picture, confirmed once more by this consolidation: **TFF Digital is architecturally sound, has no confirmed security vulnerability, and is not blocked by technical debt — but is not yet fully launched, because of one external configuration issue and a short list of specific, well-understood, already-diagnosed items.**

Reconciling all ten phases against the master audit surfaces:
- **One P0**, unchanged in every phase that touched it: real WordPress content is noindexed live. WordPress-side, not code.
- **A small number of P1 items**, most already well-scoped and small: a live, reproducible crash bug; an unresolved (not broken, not fixed — genuinely unverified) email-delivery question; a homepage structured-data leak; a content-credibility issue that is a business decision, not a code defect, but the single highest-leverage item in the entire series to resolve.
- **A real volume of P2/P3 items** — none blocking, all catalogued, none contradicting each other.
- **A meaningful body of already-resolved work** that should not be reopened — the Case Study WordPress migration, View/Preview architecture for two content types, canonical/domain fixes, and several content-integrity fixes all confirmed still holding, with no regression found anywhere across the entire series.

This document is the single source of truth going forward. Findings are presented once, with a final reconciled status — not once per phase.

---

## 2. Audit Coverage

| Phase | Report Found | Major Areas Covered | Status |
|---|---|---|---|
| Master/Baseline | ✅ `docs/TFF_DIGITAL_MASTER_AUDIT.md` (551 lines) | Full-stack baseline: architecture, content, WordPress, SEO, security, performance, UX, a11y, deployment, content quality | Complete |
| Phase 1 | ✅ `PHASE_1_ARCHITECTURE_DEPENDENCIES_CODE_QUALITY_AUDIT.md` (397 lines) | Architecture, dependencies, code quality, environment config, testing | Complete |
| Phase 2 | ✅ `PHASE_2_SEO_METADATA_INDEXABILITY_RE_AUDIT.md` (449 lines) | SEO, metadata, canonical, OG, JSON-LD, sitemap, robots, indexability | Complete |
| Phase 3 | ✅ `PHASE_3_SECURITY_PERFORMANCE_ACCESSIBILITY_UI_CODE_QUALITY_AUDIT.md` (486 lines) | Security, performance, accessibility, UI/responsive, error handling, forms, WordPress security boundary | Complete |
| Phase 4 | ✅ `PHASE_4_CONTENT_WORDPRESS_INTEGRATIONS_FUNCTIONALITY_AUDIT.md` (346 lines) | WordPress content inventory, data parity, editor experience, links/routes, content quality, integrations, docs | Complete |
| Phase 5 | ✅ `PHASE_5_TESTING_RESILIENCE_EDGE_CASE_AUDIT.md` (361 lines) | Test infrastructure, WordPress-outage resilience (empirical), forms/newsletter, media/preview edge cases, hydration, API robustness, cache/ISR, monitoring | Complete |
| Phase 6 | ✅ `PHASE_6_PRODUCTION_SECURITY_INFRASTRUCTURE_AUDIT.md` (436 lines) | Secrets, git history, bundle exposure, DNS/HTTPS, WordPress/GraphQL auth boundary, redirects, CSRF/DoS/PII/privacy, logging | Complete |
| Phase 7 | ✅ `PHASE_7_FINAL_PRODUCTION_READINESS_AUDIT.md` (365 lines) | Feature/route/content inventory, headless consistency, final readiness checklist | Complete |
| Phase 8 | ✅ `PHASE_8_SEO_PERFORMANCE_ACCESSIBILITY_AUDIT.md` (270 lines) | Narrow-scope SEO/performance re-verification, deep accessibility (cards/footer/keyboard) | Complete |
| Phase 9 | ✅ `PHASE_9_PRODUCTION_FINAL_QA_AUDIT.md` (301 lines) | Final live production sweep, launch-blocker classification | Complete |
| Phase 10 | ✅ `PHASE_10_FINAL_ARCHITECTURE_CODE_QUALITY_AUDIT.md` (340 lines) | Final architecture/code-quality pass, cross-phase meta-audit | Complete |

**10/10 phases found and processed. No phase report is missing.** No other audit-shaped file exists in the repository beyond this expected set (confirmed by directory search before writing this report).

---

## 3. Final Project Status

| Dimension | Rating | Evidence |
|---|---|---|
| **Technical Health** | 🟢 GREEN | Ten phases consistently found clean architecture, zero circular dependencies, zero unnecessary complexity, zero regressions anywhere |
| **Content Readiness** | 🟡 YELLOW | Real, professional content exists for testimonials/team/case studies; the disciplines-count and enterprise-scale-claims contradiction (§13) is a genuine credibility risk; a handful of WordPress entries need editorial cleanup |
| **WordPress Readiness** | 🟡 YELLOW | Fully headless, working architecture; one P0 configuration issue (SEO-1) and zero editorial guardrails (WP-1) are WordPress-side, not code |
| **Production Readiness** | 🟡 YELLOW | Live, stable, serving traffic correctly per Phase 9's fresh live sweep; blocked from being *meaningfully* launched by SEO-1 specifically |
| **Security Posture** | 🟢 GREEN | Zero confirmed vulnerability across a dedicated security phase (6) plus continuous re-verification; defense-in-depth on preview auth empirically proven; zero secrets ever in git history |
| **SEO Readiness** | 🔴 RED | The one P0 in the entire series: all real content is noindexed live |
| **Form/Lead Readiness** | 🟡 YELLOW | Save path sound and re-verified repeatedly; email delivery genuinely unverified since the master audit; one real UX bug on the primary conversion path |
| **Maintainability** | 🟢 GREEN | Zero `any`, zero unsafe TypeScript escape hatches, disciplined layering, small and named duplication footprint, zero test coverage (a real gap, not a maintainability blocker) |

---

## 4. Genuine Launch Blockers

**One.**

| Finding | Why It Blocks Launch | Owner | Required Action | Verification Method |
|---|---|---|---|---|
| **SEO-1** | All 10 pieces of real WordPress content (2 case studies, 7 services, 1 blog post) serve `noindex, nofollow` live, while the sitemap simultaneously lists 3 of them as indexable. A site where zero real editorial content is discoverable via search is not meaningfully launched from a marketing standpoint, regardless of the code's correctness. | WordPress Admin | wp-admin → Yoast SEO → Search Appearance → Content Types — check the default indexability setting first (the pattern spans all 10 pages with zero exceptions, strongly suggesting one setting, not ten individual mistakes) | Re-fetch each real content page's `<meta name="robots">` tag after the change; confirmed noindex-free |

No other finding in this entire ten-phase series rises to a genuine, technical launch blocker. This assessment is unchanged from Phase 9's own explicit launch-blocker analysis and Phase 10's independent cross-phase re-confirmation — neither found reason to add or remove anything from this section.

---

## 5. High Priority Before Launch

Not hard blockers, but risky enough to resolve before serious traffic:

| Finding | Priority | Latest Confirmed State | Why It's High-Risk | Owner |
|---|---|---|---|---|
| **SMOKE-2** | P1 | Live-reproduced in Phase 5; not re-triggered destructively again in Phase 9 but its scope was reconfirmed unchanged | A duplicated query parameter (`?q=a&q=b`, `?after=x&after=y`) causes a genuine, unauthenticated `HTTP 500` crash on `/blog` and `/case-studies` today — reproducible by an ordinary browser extension or malformed shared link, not a contrived attack | Claude |
| **FORM-RT-2** | P2 (elevated here to launch-relevant given it affects the primary CTA) | Found and reproduced multiple times in live browser testing, Phase 5; not independently re-tested since (browser-automation-heavy, not re-run in Phase 9's curl-based sweep) | The contact form's entrance animation can leave the section non-interactive on a cold page load with no scroll — the site's main "Send a message" button can be silently unclickable. Frequency is honestly uncertain, but the downside is severe | Claude (fix) + a real-device frequency check recommended |
| **FORM-1 / email delivery** | P1 | Unresolved since the master audit; explicitly re-asked and re-confirmed still unverifiable in Phase 3, Phase 4, Phase 5, Phase 9 | Whether lead-notification/confirmation emails actually deliver in production has never been proven. Launching a lead-generation site without knowing this risks silently losing real business inquiries | Manual — one real test submission required |
| **LEAD-1** | P2 | Phase 4, unresolved since | Directly raises FORM-1's stakes: if WordPress's live lead-storage mode is `'email'` rather than `'cpt'`, a failed notification email means the lead's data is gone with **no record anywhere** — not just hard to find. Check this *before* deciding how urgently to chase the FORM-1 test, since it changes what's actually at risk | Manual — check `wp-config.php`'s `TFF_LEAD_STORAGE_METHOD` |

---

## 6. Final Pending Tasks

Only genuinely unresolved items. Full detail for every P0/P1 item; the P2/P3 tail is tabulated compactly in §8–§9 rather than repeated here in full field-by-field detail, per this report's own instruction not to manufacture noise.

| ID | Priority | Category | Task | Why It Matters | Owner | Where to Fix | Dependencies | Complexity | Launch Impact | Source Phase(s) |
|---|---|---|---|---|---|---|---|---|---|---|
| SEO-1 | P0 | SEO | Toggle WordPress/Yoast indexability default | Zero real content is discoverable via search | WordPress Admin | Yoast SEO settings | None | Trivial (~20 min) | **BLOCKER** | Master, 2, 7, 9, 10 |
| SMOKE-2 | P1 | Resilience | Guard `searchParams` against array values before `.trim()`/GraphQL use in 4 files | Live, unauthenticated crash on real routes | Claude | `blog/page.tsx`, `case-studies/page.tsx`, `blog/tag/[slug]/page.tsx`, `blog/category/[slug]/page.tsx` | None | Small | High-risk | 5, 9, 10 |
| FORM-1 | P1 | Forms/Email | Submit one real test lead; confirm WordPress storage + both email deliveries | Business-critical, unverified since the master audit | Manual | Vercel dashboard (confirm real Resend/WordPress prod credentials) + one real submission | LEAD-1 should be checked first | One test | High-risk | Master, 3, 4, 5, 7, 9, 10 |
| LEAD-1 | P2 | Forms/Data-loss risk | Confirm live `TFF_LEAD_STORAGE_METHOD`; consider switching to `'cpt'` if currently `'email'` | Determines whether FORM-1's downside is "inconvenient" or "data loss" | Manual (WordPress) | `wp-config.php` | None | Small | High-risk (conditional) | 4, 6, 7, 9, 10 |
| FORM-RT-2 | P2 | UX/Forms | Fix contact-form entrance-animation trigger; validate on a real device | Primary CTA can go silently non-interactive | Claude + manual validation | `ContactFormSection.tsx` | None | Small-medium | High-risk | 5, 9, 10 |
| SEO-2 | P1 | SEO | Narrow `SelectedWork`'s prop type to exclude the unused `seo` field | Internal CMS hostname visible in homepage page source (not crawlable, still a leak) | Claude | `SelectedWork.tsx`, `src/app/page.tsx` | None | Small | None (post-launch fine) | Master, 2, 4, 9, 10 |
| CONTENT-Q1/Q2/Q3 | P1 | Content/Business | Reconcile the site's real scale/story against its own marketing copy | The homepage/About page contradict their own honest, verified content a few sections later — the single highest-leverage credibility fix available | Business decision, then content edit | `/`, `/about` copy | None | Business conversation + a copy pass | High-value, not a technical blocker | 4, 7, 9, 10 |

Everything else genuinely pending is P2 or lower — see §9 for the complete tabulation.

---

## 7. P0 Findings

| ID | Finding | Status | Owner |
|---|---|---|---|
| SEO-1 | All 10 real WordPress content pages noindexed live; sitemap lists 3 as indexable | **ACTIVE** | WordPress Admin |

The only P0 in the entire ten-phase series, unchanged and re-confirmed live as recently as Phase 9.

---

## 8. P1 Findings

| ID | Finding | Status | Owner | Notes |
|---|---|---|---|---|
| SEO-2 | Homepage JSON-LD hydration payload leaks `cms.tffdigital.com` URLs via `SelectedWork`'s unused `seo` prop | **ACTIVE** | Claude | Not crawlable (never reaches the actual `<script type="application/ld+json">` block) — a page-source leak, not an SEO-ranking defect |
| SMOKE-2 | Duplicated query parameters crash `/blog`/`/case-studies` with an uncaught 500 | **ACTIVE** | Claude | Live-reproduced, not theoretical |
| FORM-1 | Contact-form email delivery unverified | **MANUAL ACTION REQUIRED** | Manual | Genuinely unknown outcome — not "broken," not "fixed" |
| ARCH-1 | Services listing/homepage grid hardcoded while the detail route already renders live WordPress data | **PARTIALLY RESOLVED** (code path fully built and proven via the detail route; blocked only on content readiness) | Business + Claude | Gated on CMS-9's editorial cleanup, not a code gap |
| PERF-2 | Zero web analytics instrumented anywhere | **BUSINESS DECISION** | Business, then Claude | The agency has zero first-party visibility into its own traffic/conversions |
| CONTENT-Q1 | Homepage says "Sixteen disciplines"; About/Services independently say "Nine" | **BUSINESS DECISION**, then Claude-fixable once resolved | Business | Directly contradicts itself within one click-path |
| CONTENT-Q2 | About page's "Our Story" claims 40+ operators/four continents/$480M+ revenue, contradicting the same page's real 6-person team | **BUSINESS DECISION** | Business | Most consequential finding in the entire series — a trust problem, not a technical one |
| CONTENT-Q3 | Homepage hero stats and unattributed campaign numbers contradict the site's own real Upwork badge and real case-study numbers | **BUSINESS DECISION** | Business | Same root cause as CONTENT-Q2 |

---

## 9. P2 Findings

Compact tabulation — full detail in each item's originating phase report.

| ID | Finding | Status | Owner |
|---|---|---|---|
| LEAD-1 | `'email'` WordPress lead-storage mode risks total data loss on email failure | MANUAL ACTION REQUIRED | Manual (WordPress) |
| FORM-RT-2 | Contact form can be non-interactive on cold load | ACTIVE | Claude + manual validation |
| SEC3-1 | Case-study "Visit project" link renders `projectUrl` with no scheme validation | ACTIVE | Claude |
| WP-1 | WordPress enforces zero required fields; `featured_on_homepage` defaults `true` | MANUAL ACTION REQUIRED | Manual (WordPress ACF config) |
| ARCH-2 | Dormant Portfolio layer; 6 real WordPress entries, zero frontend consumers | BUSINESS DECISION | Business |
| ARCH-3 | `WORDPRESS_USE_MOCK_DATA` silently overrides a configured real endpoint | ACTIVE (trivial guard comment not yet added) | Claude + manual Vercel confirm |
| ARCH-5 | No HTML sanitizer on WordPress rich-text content (`ArticleContent.tsx`) | ACTIVE | Claude |
| CQ-1 | Zod not applied at the WordPress response boundary | ACTIVE (concretized by PARTIAL-1) | Claude |
| PARTIAL-1 | `.nodes` accessed without full optional chaining in 5 locations, 4 adapters | ACTIVE | Claude |
| DEP-1 | 4 HIGH npm audit vulnerabilities (nanoid/postcss/sharp) | ACTIVE | Claude (nanoid) + deferred major upgrade (postcss/sharp) |
| DEP-2 | Zero automated test coverage | ACTIVE | Claude |
| OG-1 | `og:url` missing on all 13 statically-defined pages | ACTIVE | Claude |
| SITEMAP-1 | Blog category/tag pages missing from sitemap | ACTIVE | Claude |
| CONTENT-1 (Phase 2) | `stripHtml` doesn't decode HTML entities — live-visible malformed text | ACTIVE | Claude |
| CMS-9 | WordPress service entries carry visible test/placeholder copy, now confirmed live in public share previews | BUSINESS/CONTENT | Manual (WordPress editorial) |
| OUTAGE-2 | Branded `error.tsx` doesn't catch on-demand-render CMS failures | ACTIVE | Claude (partial — Vercel-parity unconfirmed) |
| CACHE-1 | Deleted WordPress content can stay live for a full outage window | ACTIVE | Claude (partial) |
| MONITOR-1 | WordPress-save failures in the lead pipeline never logged | ACTIVE | Claude |
| DNS-1 | `cms.tffdigital.com` has no HTTPS enforcement or HSTS | MANUAL ACTION REQUIRED | Manual (Bluehost) |
| LOG-1 | Failed preview-secret attempts produce zero log trace | ACTIVE | Claude |
| A11Y-4 | Mobile nav has no keyboard focus trap | ACTIVE | Claude |
| A11Y-5 | Sitewide entrance animations ignore `prefers-reduced-motion` | ACTIVE | Claude |
| A11Y-FOOTER-1 | Footer newsletter input has no associated label (resolves master audit's open A11Y-2) | ACTIVE | Claude |
| CARDA11Y-1 | Blog/Case Study cards wrap all content in one unlabeled link | ACTIVE | Claude |
| FORMA11Y-1 | Contact form success state has no screen-reader announcement | ACTIVE | Claude |
| PARITY-1 | Real service `icon` field unused; 6/7 services show generic fallback icon | ACTIVE | Claude |
| CONTENT-Q4 | FAQ answers missing from server-rendered HTML except the first, sitewide | ACTIVE | Claude |
| CONTENT-Q5 | `/services/ai-consulting` has zero body description | BUSINESS/CONTENT | Manual (WordPress) |
| CONTENT-Q6 | Unfilled `[GOVERNING JURISDICTION]` placeholder live in both legal pages | BUSINESS/CONTENT | Manual + business (confirm jurisdiction) |
| DOCS-1 | `MIGRATION_REPORT.md` actively contradicts current architecture | ACTIVE | Claude (partial) |
| PERF-1 | `/services/[slug]` has no ISR, live-quantified at 2-4x slower per visit | ACTIVE | Claude |
| PERF-4 | `generateMetadata`+body duplicate WordPress fetch | ACTIVE | Claude |

---

## 10. P3 Findings

Compact list, grouped by theme — see each item's originating phase for full detail.

**SEO/metadata polish:** OG-2 (og:type inaccuracy, supersedes master audit's SEO-4), CANON-1 (canonical `??`/empty-string footgun, latent), IDX-1 (`X-Robots-Tag` header absent), META-1 (duplicate 404 robots meta), SEO-5 (blog 404 title inconsistency), SEO-6 (robots.txt no Disallow rules), JSONLD-1 (Services listing missing BreadcrumbList).

**Code quality/architecture:** ARCH-4 (dormant navigation layer — recommend leave as-is), ARCH-6 (contact info duplicated as literals across 4 files), ARCH-7 (preview-auth env vars bypass config layer), ARCH-8 (preview route handlers duplicate control flow), ARCH-9 (3 zero-consumer components — decision needed, not deletion), CQ-2 (3 config files missing `server-only` guard), CQ-3 (duplicated timeout constant), CONTENT-2/3/4 (Phase 2's minor stripping/dedup gaps), PARITY-2 (unused `results` field), PERF-5 (double-priority images), PERF-6 (unconditional CSS import).

**Dependencies:** DEP-3 (Next.js 1 major, TypeScript 2 majors, eslint/framer-motion/@types-node each 1 major behind).

**Security/infrastructure hardening:** GQLSCHEMA-1 (GraphQL "did you mean" schema leak, independently found twice), BRUTEFORCE-1 (vague preview-secret generation guidance), API-1 (preview-route Cache-Control imprecision), RESEND-LOG-1 (email-failure logs lack context).

**Accessibility polish:** UX-1/UX-2/UX-3/UX-4/UX-5/UX-6 (master audit, not independently re-verified since but structurally unchanged given zero commits), A11Y-1/A11Y-3 (case-study stat grouping; CTA button contrast — the latter a brand-color business decision), FORMA11Y-2 (missing autocomplete attributes).

**Content/inventory:** CONTENT-INV-1 (dormant WordPress Pages, empty, slug-collision risk if activated), CONTENT-INV-2/ROUTE-2 (zero real WordPress tags exist — content-dormant, not broken).

**Documentation/repo hygiene:** DOCS-2 (README is boilerplate), DOCS-3 (no WordPress plugin runbook), DOCS-4 (now 12 documents, no index — **this master report is intended to serve as that index going forward**), the plugin `.zip`/`.php` sync observation (Phase 10, folded into DOCS-3).

**Infrastructure:** INFRA-1 (Bluehost IP-ban, ~20 min recurring, already root-caused and hardened against), INFRA-4 (apex `http://` takes 2 redirect hops), CMS-1/3/5/6/7/8 (WordPress-core-default items, low severity, already classified EXPECTED/ACCEPTABLE across Phase 6), SEC-1/2/5/6/7/8 (same pattern, master audit's security table).

---

## 11. Manual / WordPress / Vercel Tasks

**A. WordPress Admin**
- SEO-1 — toggle Yoast indexability default (P0)
- CMS-9 / CONTENT-Q5 — editorial cleanup of 7 service entries, one with zero description
- CONTENT-Q6 — fill the legal-page jurisdiction placeholder (needs a business answer first)
- WP-1 — consider changing `featured_on_homepage`'s ACF default to `false`; consider marking core case-study fields required
- SEC-2 — rename the enumerable "admin" username (optional hardening)

**B. wp-config / Hosting**
- LEAD-1 — confirm `TFF_LEAD_STORAGE_METHOD` in `wp-config.php`
- DNS-1 — add HTTP→HTTPS redirect + HSTS for `cms.tffdigital.com` (Bluehost)
- INFRA-1 — follow up the Bluehost IP-ban ticket

**C. Vercel**
- FORM-1 — confirm Production `RESEND_API_KEY`/`EMAIL_FROM`/`LEAD_NOTIFICATION_EMAIL` are real, not placeholders
- VERCEL-1 — confirm credential env vars are scoped Production-only, not also Preview
- RSC-1 — optionally review function logs around the Phase 5 timestamp for the intermittent 503 (low priority, inconclusive)

**D. DNS / Infrastructure**
- INFRA-4 — optionally collapse the apex `http://` redirect to one hop

**E. Real-Device / Manual Testing**
- Mobile/tablet responsive verification — the single most consistently-unresolved item across the entire series (browser-automation tooling limitation, independently confirmed 5 times)
- FORM-RT-2's real-world frequency
- One real contact-form submission (FORM-1)
- A real screen-reader pass (VoiceOver/NVDA)

**F. Business/Content Decisions**
- See §13.

---

## 12. Claude-Fixable Tasks

SMOKE-2, SEO-2, PARTIAL-1, CQ-1 (Zod schemas), ARCH-5 (sanitizer), ARCH-3 (guarding comment), OG-1, SITEMAP-1, CONTENT-1 (Phase 2), PARITY-1, CONTENT-Q4, MONITOR-1, LOG-1, A11Y-4, A11Y-5, A11Y-FOOTER-1, CARDA11Y-1, FORMA11Y-1, FORMA11Y-2, FORM-RT-2 (the code fix), SEC3-1, OUTAGE-2 (partial), CACHE-1 (partial), DEP-1's nanoid portion, PERF-1, PERF-4, PERF-5, PERF-6, DOCS-1 (partial — superseded-banner), and the full P3 code-quality tail in §10.

**None of these require WordPress credentials, Vercel access, or a business decision to implement.**

---

## 13. Business / Content Tasks

The items this entire audit series has consistently pointed to as needing a human decision, not a code fix:

1. **The content-credibility trio (CONTENT-Q1/Q2/Q3)** — what is the site's actual, honest scale story? This is the single highest-leverage item available, per Phase 7's own explicit assessment, unrevised by any later phase.
2. **CMS-9 / CONTENT-Q5** — real WordPress service copy needed for 7 entries.
3. **CONTENT-Q6** — confirm the governing legal jurisdiction (likely India, given the business address); consider whether real legal review is warranted given the pages' own self-disclosure that they haven't had any.
4. **ARCH-2** — build the Portfolio/Projects feature (6 real WordPress entries already exist) or leave it dormant.
5. **ARCH-1** — approve the Services content cleanup so the listing/homepage migration (already fully coded) can flip live.
6. **FORM-3** (newsletter, master audit — carried through every phase, never resolved) — wire the newsletter to a real backend or remove it; it currently silently discards every email a visitor enters.
7. **PERF-2** — choose an analytics provider.
8. **A11Y-3** — is the primary CTA button's brand-color contrast (~3.69:1, below AA) worth changing?

---

## 14. Optional Improvements

Analytics instrumentation (pending §13's decision), a real test suite, a CI pipeline, `engines.node` pinning, dependency version-drift maintenance (DEP-3), COOP/CORP headers, `X-Robots-Tag` on noindexed routes, README/plugin-runbook authorship, the full P3 polish tail in §10.

---

## 15. Resolved Findings

**Confirmed by evidence, not assumption — do not reopen.**

| ID | Original Issue | Resolution | Evidence | Phase |
|---|---|---|---|---|
| — | Case Studies were mock/hardcoded, not WordPress-driven | Fully migrated to a live WordPress-headless pipeline | Full repository/service/adapter/GraphQL stack confirmed built and live; 2 real published entries | Master, re-confirmed every phase since |
| — | Case Study Preview did not exist | Built via Next.js Draft Mode, constant-time secret auth | Live-tested repeatedly; Phase 6 confirmed WordPress's own `asPreview` independently authenticated too (defense-in-depth) | Master, 3, 4, 5, 6, 9 |
| — | Case Study View permalinks pointed at the CMS domain | Plugin filter rewrites permalinks to the frontend | Live-confirmed `www.tffdigital.com/case-studies/[slug]` resolution | Master, re-confirmed every phase since |
| — | Service View/Preview did not exist | Same mechanism as Case Study, extended to Services | Live-tested, defense-in-depth confirmed | Master, 3, 4, 5, 6, 9 |
| — | Blog View did not exist | Built, WordPress-driven | Live-confirmed | Master onward |
| — | Homepage "Selected Work" preview cards were placeholder/missing | Real mshots website-preview screenshots, SSRF-guarded | Live-confirmed loading correctly; guard re-verified twice (Phase 3, Phase 6) | Master, 3, 5, 6 |
| — | Testimonial cards clipped on hover (a real, previously-reported bug) | Fixed via an explicit CSS technique (commit `c80965a`) | Confirmed in code AND live production | 3, 5 |
| — | `/#work` anchor could vanish if `SelectedWork` had zero case studies to render | Section now renders unconditionally; only inner content swaps | Code-confirmed structurally unconditional, not just "currently fine" | 5 |
| — | www/apex canonical and domain leakage | Fixed; canonical fully www-based sitewide | Zero apex/CMS-domain leakage found in any live check across the entire series | Master onward |
| — | A published "Test" case study (all fields literally "Test") was live | Deleted from WordPress | Confirmed absent via live GraphQL | Master |
| — | Fabricated testimonials/team/trust-signal content (invented names, fake logos) | Replaced with real, verbatim-sourced content | Re-confirmed via a full fresh content read in Phase 4 | Master, 4 |
| — | Conflicting/fake contact info (two emails, fake US phone numbers) | Single-sourced, real, consistent `info@tffdigital.com` / `+91 72068 09816` | Re-confirmed across every page checked in Phase 4/9 | Master, 4, 9 |
| — | `tff-headless-leads` plugin v1.4.0 View/Preview believed to need a manual wp-admin upload | Confirmed already live in production | Live REST `link`-field evidence, re-derived independently four times | Master |
| — | A `seo: null`-triggered bug silently stripped the layout's default OG/Twitter card on some pages | Fixed via a documented guard structure | Code confirmed correct and matches Next.js's documented inheritance semantics | 3 |
| — | Master audit's A11Y-2 ("footer newsletter label — flagged, not confirmed") | **Not resolved — clarified.** Confirmed genuinely true from source, re-filed with full evidence as **A11Y-FOOTER-1** | Direct source read | 8 |

---

## 16. Partially Resolved Findings

| ID | What's Fixed | What Remains | Next Action |
|---|---|---|---|
| ARCH-1 | The entire fetch/adapter/service code path for live WordPress service data is built and proven (the detail route already uses it successfully) | The listing/homepage grid still shows hardcoded placeholder data | Business: approve WordPress service-copy cleanup (CMS-9), then flip the 5 tracked `TODO`s |
| OUTAGE-2 | The strict/soft resilience split and ISR stale-serve behavior are empirically proven correct for the general case | The specific edge of an on-demand render during an outage doesn't reach the branded error boundary | Claude: diagnose the App Router error-boundary wiring for this specific path; Vercel-parity unconfirmed |
| CACHE-1 | Stale ISR content correctly survives a temporary outage (proven, not assumed) | Deleted content could stay live for the *full* duration of a longer outage, not just 60 seconds | Claude: consider a shorter revalidate window or webhook-based on-demand revalidation |
| DEP-1 | The `nanoid` vulnerability has a free, isolated, non-breaking fix available | `postcss`/`sharp` remain vulnerable, gated behind the already-planned Next.js 15→16 major upgrade | Claude: apply the nanoid fix now; schedule the major upgrade separately |
| A11Y-2 → A11Y-FOOTER-1 | The open *question* is resolved (confirmed true, not left ambiguous) | The underlying accessibility gap itself is still active | Claude: add a real `label` to the Footer newsletter input |

---

## 17. Content Type Master Matrix

| Content Type | Source | Frontend Route | View | Preview | SEO | Status |
|---|---|---|---|---|---|---|
| Case Study | WordPress | `/case-studies/[slug]` | ✅ | ✅ | ✅ | **SUPPORTED** |
| Service | WordPress | `/services/[slug]` (detail only) | ✅ | ✅ | ✅ | **SUPPORTED** (detail); listing **INCOMPLETE** (ARCH-1) |
| Blog Post | WordPress | `/blog/[slug]` | ✅ | ❌ | ✅ | **SUPPORTED** (View); Preview **INTENTIONALLY UNSUPPORTED** (CTP-1) |
| Projects | WordPress (dormant) | None | ❌ | ❌ | N/A | **PENDING DECISION** — 6 real entries, full data layer built, zero consumers (ARCH-2) |
| Testimonials | Static file | Embedded in sections | N/A | N/A | N/A | **INTENTIONALLY UNSUPPORTED** as WP-driven — real content lives statically by design |
| Team | Static file | Embedded in sections | N/A | N/A | N/A | **INTENTIONALLY UNSUPPORTED**, same reasoning |
| FAQ | Static file | Embedded in sections | N/A | N/A | Partial (CONTENT-Q4) | **INTENTIONALLY UNSUPPORTED** as WP-driven; SSR-completeness gap is a separate, active issue |
| Pages | WordPress (dormant) | None | ❌ | ❌ | N/A | **INTENTIONALLY UNSUPPORTED** — all 6 entries empty, zero route usage |

---

## 18. System Area Master Matrix

| Area | Status | Priority | Remaining Work |
|---|---|---|---|
| Architecture | 🟢 Sound | — | None |
| WordPress | 🟡 Sound, one config gap | P0 | SEO-1 |
| GraphQL | 🟢 Sound, defense-in-depth confirmed | — | GQLSCHEMA-1 (P3, optional) |
| Routing | 🟢 Sound | — | CMS-8 (low priority) |
| Preview | 🟢 Sound | — | Blog Preview intentionally deferred |
| Forms | 🟡 Save path sound; email/UX gaps | P1/P2 | FORM-1, FORM-RT-2, LEAD-1 |
| Email | 🟡 Code complete, unverified | P1 | FORM-1 |
| SEO | 🔴 One P0 | P0/P1/P2 | SEO-1, SEO-2, OG-1, SITEMAP-1 |
| Sitemap | 🟡 Gaps, non-blocking | P2 | SITEMAP-1 |
| Analytics | 🔴 Not implemented | P1 (business) | Provider decision |
| Performance | 🟢 Sound, one known gap | P2 | PERF-1 |
| Accessibility | 🟡 Real gaps, none blocking | P2 | A11Y-4/5, FORMA11Y-1, CARDA11Y-1, A11Y-FOOTER-1 |
| Security | 🟢 No confirmed vulnerability | P2/P3 | SEC3-1, LOG-1, DNS-1 |
| Testing | 🔴 Zero coverage | P2 | DEP-2 |
| Deployment | 🟢 Sound, reproducible | — | Minor: `engines.node` unpinned |
| Dependencies | 🟡 Known, scoped | P2/P3 | DEP-1 (nanoid), DEP-3 |
| Documentation | 🟡 Real gaps | P2/P3 | DOCS-1/2/3 |
| Repository Hygiene | 🟢 Clean | INFO | Plugin zip/source sync |
| Content | 🟡 Credibility issue | P1 (business) | CONTENT-Q1/Q2/Q3 |
| Infrastructure | 🟡 Known, external | P1/P2 | INFRA-1 (Bluehost), DNS-1 |

---

## 19. Deduplication Log

Findings that appeared across multiple phases, consolidated into one entry here:

- **SEO-1** — appeared in the master audit, Phase 2 (regression check), Phase 7 (readiness checklist), Phase 8 (SEO re-verification), Phase 9 (live re-confirmation), Phase 10 (cross-phase citation) → **consolidated into one active P0 finding**, not six separate tasks.
- **SEO-2** — master audit, Phase 2, Phase 4 (regression pass), Phase 6 (regression spot-check), Phase 9 (live re-confirmation, still exactly 12 occurrences) → **one active P1 finding**.
- **FORM-1** — master audit, Phase 3, Phase 4, Phase 5, Phase 7, Phase 9, Phase 10 → **one unresolved manual-verification item**, never independently re-derived, always cited forward.
- **GraphQL schema-leak-via-error-suggestion** — discovered *independently* by two separate research passes within Phase 6 itself (`GQLSCHEMA-1` and `GQL-DISCLOSE-1`) → **already merged into one finding at the time**; noted here as a positive corroboration signal, not a duplication problem.
- **`.nodes` optional-chaining gap** — first implied by Phase 1's broader CQ-1 (no Zod at the WordPress boundary), then given specific file:line locations by Phase 5's PARTIAL-1 → **two related findings, not duplicates**: CQ-1 is the architectural gap, PARTIAL-1 is one concrete, high-value instance of it. Both kept, cross-referenced.
- **Testimonial hover-clipping** — fixed pre-audit-series, re-confirmed resolved in both Phase 3 (code) and Phase 5 (live production) → **one resolved item**, not two.
- **`/#work` anchor risk** — raised as a historical concern, closed out in Phase 5 with a structural (not just current-state) confirmation → **one resolved item**.

---

## 20. Contradictions / Reconciliations

**One genuine tension found and reconciled — not a standing disagreement.**

The master audit's executive summary states *"Zod schemas at every external boundary."* Phase 1's dedicated code-quality investigation found this is only true for the contact-form **input** direction — none of the 8 WordPress repositories validate response **shape** at runtime. This is a **self-correction within the series**: Phase 1 explicitly framed it as narrowing an overstated claim, not as disagreeing with an equally-weighted alternative source. **Final reconciled status:** the master audit's line should be read as accurate only for form input; CQ-1 (and its concrete instance, PARTIAL-1) tracks the response-boundary gap as a real, still-open P2 finding.

**No other material contradiction was found between any two phases** — confirmed specifically by Phase 10's cross-phase review, which checked every "resolved" claim against its original verification method and found none of them were bare assertions.

---

## 21. Technical Debt

The complete, named list — small enough to enumerate exactly, which is itself evidence of a well-maintained codebase: CQ-1 (Zod at the WordPress boundary), PARTIAL-1 (its concrete 5-location instance), CQ-2 (3 files missing `server-only` guards), CQ-3 (duplicated timeout constant), CONTENT-2/3/4 (minor stripping/dedup gaps), ARCH-6/7/8 (small duplication/config-layer inconsistencies), DEP-1/DEP-3 (dependency currency), DEP-2 (zero test coverage — the single largest technical-debt item in the codebase), DOCS-1/2/3 (documentation currency), the plugin zip/source sync gap. **No item on this list is large, tangled, or mutually reinforcing** — each is independently small and independently fixable, which is the practical definition of "not blocked by technical debt."

---

## 22. Testing Gaps

Zero automated test coverage exists anywhere in the repository (DEP-2, unchanged since the master audit). This has been substituted for, throughout this audit series, by an unusual amount of *manual and empirical* verification: real live production testing (every phase), a real local production build run against a genuinely broken WordPress endpoint (Phase 5), real browser console/keyboard testing (Phase 5, Phase 8), and a real downloaded-bundle secret scan (Phase 6). **This substitution has been effective for finding real issues, but it is not a replacement for regression protection going forward** — once fixes begin, there is no automated safety net to catch a future reintroduction of any resolved item in §15. Recommend prioritizing test coverage for exactly the flows this series found the most value in manually verifying: the WordPress-outage resilience behavior, the preview-auth boundary, and the contact-form pipeline.

---

## 23. Final Production Readiness

**Not yet fully launched — blocked by exactly one external, non-technical item, with a short list of high-value items worth resolving alongside it.** The application itself — code, architecture, security posture — has been technically ready since well before this audit series began; what remains is the WordPress-side SEO configuration (SEO-1), one real verification only a human can perform (FORM-1), two small Claude-fixable bugs worth fixing before any serious traffic push (SMOKE-2, FORM-RT-2), and a business conversation worth having soon rather than deferred indefinitely (the content-credibility trio). This is the same verdict Phase 7, Phase 9, and Phase 10 each independently reached — this consolidation changes nothing about it, only confirms it once more with everything now in one place.

---

## 24. Recommended Implementation Order

**STEP 1 — P0 blockers**
1. SEO-1 (wp-admin, ~20 minutes)

**STEP 2 — P1 launch-risk items**
2. LEAD-1 (cheap manual check — do this before FORM-1 to know the real stakes)
3. FORM-1 (one real test submission)
4. SMOKE-2 (small, self-contained code fix)
5. FORM-RT-2 (small code fix + real-device validation)

**STEP 3 — Remaining P1**
6. SEO-2 (small code fix)
7. The content-credibility conversation (CONTENT-Q1/Q2/Q3) — not code, but worth having in this window, not deferred

**STEP 4 — P2**
8. Batch the Claude-fixable P2 list (§9/§12) as a small number of grouped PRs — logging (MONITOR-1/LOG-1 share one root cause, fix together), accessibility (A11Y-4/5, FORMA11Y-1, CARDA11Y-1, A11Y-FOOTER-1), SEO completeness (OG-1, SITEMAP-1, CONTENT-1), resilience (PARTIAL-1, OUTAGE-2, CACHE-1), SEC3-1.
9. Manual/WordPress items: CMS-9/CONTENT-Q5/Q6 editorial pass, WP-1's ACF defaults, DNS-1.
10. Business decisions: ARCH-1 (content-gated), ARCH-2, FORM-3, PERF-2.

**STEP 5 — P3**
11. The full P3 tail in §10, opportunistically, no urgency.

**STEP 6 — Optional improvements**
12. Test suite, CI pipeline, dependency version maintenance, documentation authorship.

---

## 25. Final Master TODO

### P0
- [ ] SEO-1 — toggle WordPress/Yoast indexability default

### P1
- [ ] SMOKE-2 — guard `searchParams` against array values (4 files)
- [ ] FORM-1 — one real test lead submission; confirm storage + both emails
- [ ] SEO-2 — narrow `SelectedWork`'s prop type

### P2
- [ ] LEAD-1 — confirm `TFF_LEAD_STORAGE_METHOD`
- [ ] FORM-RT-2 — fix contact-form entrance-animation trigger
- [ ] SEC3-1 — add scheme validation to the case-study Project URL link
- [ ] PARTIAL-1 — add optional chaining before `.nodes` in 5 locations
- [ ] CQ-1 — add Zod schemas at the WordPress response boundary
- [ ] DEP-1 — apply the isolated nanoid fix
- [ ] DEP-2 — scaffold a test suite, starting with preview + lead-pipeline paths
- [ ] OG-1 — add `openGraph.url` to static pages
- [ ] SITEMAP-1 — add blog category/tag pages to the sitemap
- [ ] CONTENT-1 (Phase 2) — decode HTML entities in `stripHtml`
- [ ] OUTAGE-2 — diagnose the on-demand-render error-boundary gap
- [ ] CACHE-1 — consider a shorter revalidate window or webhook revalidation
- [ ] MONITOR-1 — log WordPress-save failures
- [ ] LOG-1 — log failed preview-secret attempts
- [ ] A11Y-4 — add a focus trap to the mobile nav
- [ ] A11Y-5 — respect `prefers-reduced-motion` in shared animation presets
- [ ] A11Y-FOOTER-1 — add a real label to the Footer newsletter input
- [ ] CARDA11Y-1 — add `aria-label` to Blog/Case Study card links
- [ ] FORMA11Y-1 — add a live region to the contact form's success state
- [ ] PARITY-1 — wire the real service `icon` field or fix the icon dictionary
- [ ] CONTENT-Q4 — render all FAQ answers in initial HTML
- [ ] PERF-1 — add `generateStaticParams`/ISR to `/services/[slug]`
- [ ] PERF-4 — resolve the `generateMetadata`+body duplicate fetch
- [ ] ARCH-3 — add a guarding comment around `WORDPRESS_USE_MOCK_DATA`
- [ ] ARCH-5 — add an HTML sanitizer to WordPress rich-text rendering

### P3
- [ ] OG-2, CANON-1, IDX-1, META-1, SEO-5, SEO-6, JSONLD-1 (SEO polish batch)
- [ ] ARCH-4, ARCH-6, ARCH-7, ARCH-8, ARCH-9 (small architecture nits)
- [ ] CQ-2, CQ-3, CONTENT-2/3/4, PARITY-2, PERF-5, PERF-6 (code-quality batch)
- [ ] DEP-3 (routine dependency bumps)
- [ ] GQLSCHEMA-1, BRUTEFORCE-1, API-1, RESEND-LOG-1 (hardening batch)
- [ ] UX-1 through UX-6, A11Y-1, FORMA11Y-2 (a11y/UX polish batch)
- [ ] DOCS-2, DOCS-3, DOCS-4 (documentation batch — this master report now serves as DOCS-4's index)
- [ ] INFRA-4 (single-hop apex redirect)

### Manual
- [ ] SEO-1 — wp-admin
- [ ] LEAD-1 — `wp-config.php` check
- [ ] FORM-1 — real test submission + Vercel credential confirmation
- [ ] CMS-9 / CONTENT-Q5 — WordPress service copy cleanup
- [ ] CONTENT-Q6 — legal jurisdiction + review decision
- [ ] WP-1 — ACF field defaults, if pursued
- [ ] DNS-1 — Bluehost HTTPS/HSTS for the CMS domain
- [ ] VERCEL-1 — confirm env var Environment scoping
- [ ] Real mobile-device testing
- [ ] A real screen-reader pass

### Business Decision
- [ ] CONTENT-Q1/Q2/Q3 — the site's real scale/story
- [ ] ARCH-1 — approve service content cleanup
- [ ] ARCH-2 — build or leave dormant the Portfolio feature
- [ ] FORM-3 — newsletter: build or remove
- [ ] PERF-2 — analytics provider
- [ ] A11Y-3 — CTA button contrast vs. brand color

### Optional
- [ ] CI pipeline
- [ ] `engines.node` pinning
- [ ] README / plugin runbook authorship
- [ ] COOP/CORP headers

---

## 26. Notes / Evidence

Every finding ID in this document traces to at least one of the eleven source reports listed in §2, each of which contains the full original evidence (file:line citations, live curl output, screenshots-in-text, GraphQL query/response pairs) this consolidation summarizes but does not repeat in full. Where this document states a status, that status is the *latest reconciled* state across every phase that touched the finding — per §3 of the Phase 10 spec's own reconciliation rule, not a copy of any single phase's original framing. No finding in this document was invented, and none was silently marked resolved without a specific evidence citation traceable to a source phase.

---

## GIT SAFETY

`git status` run before starting this consolidation and immediately after writing this report:

- **Before:** 11 pre-existing unstaged `docs/*.md` deletions (unchanged since Phase 3) + 10 untracked Phase reports + `docs/TFF_DIGITAL_MASTER_AUDIT.md`, all as expected.
- **After:** identical, plus this one new file.
- No source code changed.
- No package files changed.
- No configuration changed.
- No WordPress plugin changed.
- No deployment performed.
- No commit created.
- No push performed.
- HEAD: `0ff429c8b1bdfc254c31de6860c972f6f7ee4e91` — unchanged.

**The only new file created by this consolidation is `MASTER_AUDIT_REPORT_PHASE_1_TO_10.md`.**
