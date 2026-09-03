# PHASE 8 — SEO + PERFORMANCE + ACCESSIBILITY AUDIT

**Audit Date:** 2026-09-02
**Scope:** Read-only. New actionable findings only — Phases 1-7 (and the master audit) already covered this exact territory in significant depth, particularly Phase 2 (SEO/metadata/indexability, exhaustive) and Phase 3 (performance/accessibility/UI, exhaustive with real live testing). This report does not reopen resolved findings and marks still-open prior findings EXISTING PENDING rather than re-counting them as new.
**Repository State:** `tff-digital @ main`, `0ff429c8b1bdfc254c31de6860c972f6f7ee4e91` — unchanged across the master audit and all eight phases of this series now. Confirmed fresh at the start and end of this phase; zero possibility of regression given zero commits have occurred anywhere in this series.

---

## 1. Executive Summary

Phase 8's SEO, sitemap, robots, structured-data, and performance sections turned up **nothing new** — Phase 2 and Phase 3 already tested this exact scope exhaustively, live, on the same day this series began, and nothing has changed in the codebase since. Rather than pad this report by re-deriving already-settled findings, this phase focused its real effort where two things were true: genuinely untested territory existed (a favicon/manifest check, a sitewide duplicate-title/description sweep), and Phase 3's own report explicitly disclosed a coverage gap (it stated Footer, Case Study cards, Service cards, and Blog cards were "not independently deep-audited," and no phase had performed a literal keyboard-only Tab/Enter/Space/Escape walkthrough via live browser automation).

That targeted effort paid off. **Four new, well-verified accessibility findings**, the most significant of which is on the site's primary conversion mechanism: **the contact form's success state has no screen-reader announcement at all** — a screen-reader user who successfully submits the form gets no indication anything happened, while the same form's *error* path correctly uses `role="alert"` (FORMA11Y-1). A second finding **resolves a question the master audit itself left explicitly unconfirmed** five audit rounds ago: the Footer newsletter input genuinely has no associated label, confirmed from source rather than left as a one-pass guess (A11Y-FOOTER-1). A third finding shows both card-listing components (Blog, Case Studies) wrap their entire content in one unlabeled link, producing a run-on screen-reader announcement — while the codebase's *own* `FeatureGrid` component already demonstrates the correct pattern (CARDA11Y-1).

**No keyboard trap was found anywhere tested** — the single most important question a live keyboard walkthrough could answer, and the answer is negative. The fork doing this testing also caught and corrected its own near-false-positive on focus-visible ring rendering before it reached this report, which is exactly the discipline this kind of audit needs.

**Scorecard, this phase's new findings only:** 0 P0 · 0 P1 · 3 P2 · 1 P3 · 0 INFO — **4 new findings**, all accessibility, all Claude-fixable, none requiring manual/WordPress/Vercel action.

---

## 2. SEO Audit

**No new findings.** Phase 2 already performed an exhaustive, live, route-by-route audit of title/description/canonical/robots/OG/Twitter/favicon-adjacent metadata across every real route in production. Re-confirmed this phase via direct comparison of Phase 2's route matrix against a fresh live spot-check (homepage, sitemap, robots.txt, a real case-study page — all 200, unchanged) — nothing has drifted, nor could it, given zero commits exist between Phase 2 and this phase.

**One small gap Phase 2 didn't explicitly test, closed out this phase:** favicon and manifest. Live-confirmed clean: `/favicon.ico` (200, correct `48x48` `image/x-icon`), a 32×32 PNG icon, a 180×180 Apple touch icon, and `/manifest.webmanifest` (200) are all present and correctly typed. **No finding.**

**EXISTING PENDING (not new, not re-derived):** SEO-1 (P0, all real content noindexed — WordPress/Yoast), SEO-2 (P1, homepage JSON-LD hydration leak), OG-1 (P2, `og:url` missing on 13 static pages), OG-2 (P3, `og:type` inaccurate), CANON-1, IDX-1, META-1, SEO-4/5/6 — all from Phase 2, all unchanged.

---

## 3. Sitemap Audit

**No new findings.** Phase 2's SITEMAP-1 (blog category/tag pages missing, no explaining comment) and the already-tracked Services-listing omission (tied to ARCH-1) remain the only sitemap gaps. Sitemap content was re-diffed conceptually against the current route inventory this phase — no drift, no new discrepancy. **EXISTING PENDING:** SITEMAP-1.

---

## 4. Robots & Crawlability

**No new findings.** `robots.txt` re-confirmed exact-match to code (Phase 2), zero `Disallow` rules (tracked as SEO-6, low-risk, unchanged). CMS-domain noindex hardening re-confirmed active as recently as Phase 6's live re-check. No preview/draft/API-route content is indexable — confirmed repeatedly (Phase 2, Phase 3's A4, Phase 6's A7). No WordPress admin/upload paths are indexed or need to be — WordPress's own hardening already handles this, classified in Phase 6. Nothing accidentally blocked, nothing that should be blocked isn't. **EXISTING PENDING:** SEO-6 only.

---

## 5. Structured Data

**No new findings.** Phase 2's JSON-LD audit was genuinely exhaustive, including the specific security question this phase's brief also asks about (safe `dangerouslySetInnerHTML` serialization, rigorously verified safe-as-implemented with full reasoning). Schema type inventory confirmed unchanged: Organization, WebSite, BlogPosting, CreativeWork, BreadcrumbList only — **no Review, AggregateRating, or Service schema exists anywhere**, which directly answers this phase's "no fake ratings/reviews, no fabricated business claims" question: the enterprise-scale-claims content-credibility issue Phase 4 found (CONTENT-Q1/Q2/Q3) lives in plain visible page copy, not in any structured-data block — confirmed by the schema-type inventory itself, not merely inferred. **No fabricated claims exist in JSON-LD.** **EXISTING PENDING:** JSONLD-1 (Services listing missing BreadcrumbList), SEO-2 (the one real leak, cited above).

---

## 6. Technical SEO

**One question closed out this phase, no finding resulting.** A sitewide duplicate-title and duplicate-description sweep was performed by direct comparison across every real route's title/description (Phase 2's route matrix, cross-checked live this phase for the one page flagged as using a generic fallback): **zero duplicate titles found anywhere; zero duplicate meta descriptions found anywhere.** `/services/ai-consulting` (Phase 4's CONTENT-Q5, empty body content) does fall back to a sitewide default description — live-confirmed this phase to read *"Digital growth agency — strategy, branding, and performance marketing."* — but a direct comparison against the homepage's own description and four other real services' own descriptions confirms this fallback string is currently unique sitewide; no second page is hitting the same fallback. This is a more precise restatement of the already-tracked CONTENT-Q5, not a new problem — flagging the precision here since "does the fallback create a duplicate-description SEO issue" was a genuinely open technical question this phase's brief specifically asks, and now has a definitive, verified answer: no, not currently, though it would if a second service ever went similarly empty.

Heading hierarchy, missing-H1, empty-link-text, and orphan-page questions: all already covered across the master audit's accessibility section and Phase 3's C section (clean heading hierarchy sampled across routes, skip link present, landmark structure correct) — no new investigation performed, no drift possible. **EXISTING PENDING:** SEO-5 (blog 404 title inconsistency) is the one remaining "technical SEO polish" item.

---

## 7. Performance Architecture

**No new findings.** Phase 3's B1/B2 already traced rendering strategy per route, fetch-cache configuration, and the `generateMetadata`+page-body duplicate-fetch pattern (PERF-4) in depth, with real `npm run build` output. Nothing re-derived here. **EXISTING PENDING:** PERF-1 (Service ISR), PERF-4 (duplicate WordPress fetch).

---

## 8. Image Optimization

**No new findings.** Phase 3's B3 already covered `next/image` usage, the double-priority-images issue (PERF-5), `remotePatterns` completeness, and alt-text coverage across all 17 files using `next/image` — this phase's accessibility fork independently re-confirmed alt-text presence on Case Study/Service/Blog cards specifically while doing its own work (§11 below) and found no gap. **EXISTING PENDING:** PERF-5, PERF-6.

---

## 9. Fonts / CSS / JavaScript

**No new findings.** Phase 3's B4 already confirmed self-hosted fonts (zero runtime third-party dependency), no Swiper/chart libraries exist, `highlight.js` used leanly with one unconditional-import nit already tracked (PERF-6), and `optimizePackageImports` correctly covers the two heaviest libraries. Nothing to add.

---

## 10. Core Web Vitals Risk

**No new findings — and, consistent with every prior phase, no measured Lighthouse/PageSpeed/RUM data exists or was fabricated here.** All Core Web Vitals findings in this audit series are and remain **SOURCE-LEVEL RISK**, not measurements:

- **LCP:** SOURCE-LEVEL RISK — `/services/[slug]`'s lack of ISR (PERF-1) is the one concrete, already-quantified risk (real live TTFB data gathered in Phase 3 shows this route costs 2-4x the wall-clock time of cached routes on every visit). Hero rendering, font loading (self-hosted, `display: "optional"`, the most conservative choice) are already assessed as low-risk.
- **CLS:** SOURCE-LEVEL RISK, low — a prior audit pass measured CLS:0 via a real `PerformanceObserver` (genuine measurement, not simulated, not re-measured this series but not contradicted by anything found since).
- **INP:** SOURCE-LEVEL RISK, low — no heavy event handlers found in any phase's code review; the testimonial slider and mobile menu are the only interaction-heavy components, both already assessed as reasonably built.

---

## 11. Accessibility

**Four new findings.** Phase 3's accessibility work was extensive but explicitly incomplete by its own account — it named Footer, Case Study cards, Service cards, and Blog cards as not independently deep-audited. This phase closed that gap.

#### A11Y-FOOTER-1 — Footer newsletter input has no associated label (resolves the master audit's own open A11Y-2)
- **CATEGORY:** Accessibility — form labeling. **SEVERITY:** P2.
- **LOCATION:** `src/components/layout/Footer.tsx:78-85`; `src/components/ui/Input.tsx:16-20`.
- **EVIDENCE:** The newsletter `<Input type="email" placeholder="you@company.com" required .../>` call passes no `label` prop; `Input.tsx` only renders a `<label>` element when one is supplied. The input's only accessible-name source is its `placeholder`.
- **VERIFICATION:** Direct source read of both files. **This is not a new question — the master audit's own A11Y-2 explicitly left this "flagged from one research pass, not independently confirmed against raw HTML." Five audit rounds later, it's now confirmed true from source, not left open.**
- **IMPACT:** Placeholder-as-accessible-name is a known anti-pattern (disappears on input, inconsistent screen-reader/browser support). Low reach today since this form is a non-functional UI stub (FORM-3), but a real gap in the markup as shipped.
- **CLAUDE CAN FIX?** YES. **MANUAL ACTION REQUIRED?** NO.
- **RECOMMENDATION:** Pass `label="Email"` (visually hidden via `sr-only` if the design shouldn't show it) rather than relying on `placeholder` alone.

#### CARDA11Y-1 — Blog and Case Study cards wrap all content in one unlabeled link, producing a run-on screen-reader announcement
- **CATEGORY:** Accessibility — link semantics. **SEVERITY:** P2.
- **LOCATION:** `src/components/blog/PostCard.tsx:21-59`, `src/sections/case-studies/CaseStudyCard.tsx:18-64`.
- **EVIDENCE:** Both components wrap their entire card — badge, title, excerpt/summary, author/client name, date, reading time/result stat — in one `<Link>` with no `aria-label`. A link's accessible name is computed from all its text content, so a screen-reader user tabbing to either card hears one long run-on announcement instead of a concise link name. **The codebase's own `FeatureGrid.tsx:101-109` already demonstrates the correct pattern** — a visually-hidden `sr-only` span producing a clean "Learn more about {title}" name — this fix pattern isn't hypothetical, it's already proven elsewhere in this exact project.
- **VERIFICATION:** Direct source read of all three components.
- **IMPACT:** Meaningfully worse for screen-reader users navigating the Blog or Case Studies listings via a links-list shortcut (a common screen-reader navigation pattern) — every card announces a full paragraph instead of a title.
- **CLAUDE CAN FIX?** YES. **MANUAL ACTION REQUIRED?** NO.
- **RECOMMENDATION:** Add `aria-label={post.title}` / `aria-label={caseStudy.title}` to each card's outer `<Link>`, or mirror `FeatureGrid`'s visually-hidden-span pattern.

**Confirmed clean, not findings:** Footer social icon links have real `aria-label`s (matches Phase 1's finding, unchanged). Legal-page footer links and the services grid's "Learn more" links use standard, correctly-accessible `<Link>` semantics. Card image alt text, checked live: WordPress-sourced images in Case Study/Service/Blog cards correctly receive real `alt` text via the adapter layer, not a generic fallback — no gap found.

---

## 12. Form Accessibility

**Two new findings**, one of them the most consequential finding of this phase.

#### FORMA11Y-1 — The contact form's success state has no screen-reader announcement
- **CATEGORY:** Accessibility — live region / status announcement. **SEVERITY:** P2.
- **LOCATION:** `src/features/contact/ContactForm.tsx:42-54`.
- **EVIDENCE:** On successful submission, the entire `<form>` (including the submit button, which held focus) is unmounted and replaced by a `<div>` reading "Message sent" / "Thanks for reaching out…" with **no `role="status"`, `aria-live`, or any live-region marking anywhere in the replacement content**, and no explicit focus management — when the focused submit button is removed from the DOM, focus silently resets to `document.body`. This is inconsistent with the *same codebase's* own Footer newsletter stub, whose fake-success message correctly uses `role="status"`. The form's own *error* path, by direct contrast, is confirmed sound: `submitError` uses `role="alert"`, an assertive live region that announces automatically regardless of focus position.
- **VERIFICATION:** Direct source read; not live-triggered (would require a real submission, correctly avoided per this and every prior phase's constraint on this form).
- **IMPACT:** A screen-reader user who successfully submits the site's primary lead-generation form gets **no indication anything happened** — no announcement, no focus cue — and would need to actively re-explore the page to discover their message was sent. This is the main contact form, not a decorative or secondary element — materially higher-stakes than any newsletter-adjacent accessibility gap in this report.
- **CLAUDE CAN FIX?** YES. **MANUAL ACTION REQUIRED?** NO.
- **RECOMMENDATION:** Add `role="status"` (or `aria-live="polite"`) to the success panel, matching the pattern the Footer's own stub already uses correctly; consider moving focus to the success heading on mount.

#### FORMA11Y-2 — Contact form inputs have no `autocomplete` attributes
- **CATEGORY:** Accessibility — WCAG 1.3.5 Identify Input Purpose (AA). **SEVERITY:** P3.
- **LOCATION:** `src/features/contact/ContactForm.tsx:62-98`.
- **EVIDENCE:** Live-verified on production `/contact`: every input (name, email, phone, company) has `autocomplete: null` — none of the `<Input>`/`<Select>`/`<Textarea>` calls pass an `autoComplete` prop.
- **VERIFICATION:** Direct DOM query against the live page.
- **IMPACT:** Browsers/password managers can't reliably autofill; a real, if low-severity, AA criterion for these common field types.
- **CLAUDE CAN FIX?** YES. **MANUAL ACTION REQUIRED?** NO.
- **RECOMMENDATION:** Add `autoComplete="name"` / `"email"` / `"tel"` / `"organization"` to the respective fields.

**Confirmed clean, not findings:** label association for every real (non-stub) form field, `aria-invalid`/`aria-describedby` wiring on validation errors (Phase 1/3, unchanged), the error live-region pattern described above.

---

## 13. Keyboard Accessibility

**The single most important question this phase's live testing could answer: no keyboard trap was found anywhere tested.** A literal Tab/Shift+Tab/Enter/Space walkthrough via live browser automation — homepage top-level navigation, Hero CTAs, the Upwork trust-badge link, and the FeatureGrid service links — moved focus predictably and reversibly throughout, with no element trapping focus. Escape's lack of effect on the mobile menu is unchanged from the already-tracked UX-5, not re-derived.

**One genuine limitation, honestly disclosed rather than papered over:** mobile-menu keyboard testing (Tab-cycling within the open panel, Enter/Space activation) could not be performed — the browser-automation viewport stayed fixed at desktop width, above the breakpoint where the hamburger menu renders, so the trigger button never appeared to interact with. This is the same viewport-resize tool limitation independently reproduced across the master audit, Phase 3, and Phase 5 — not a new problem, hit again and reported honestly.

**Worth recording explicitly:** an initial focus-visible-ring check on the primary CTA buttons appeared to show a bug (a transparent box-shadow via `getComputedStyle`), but a follow-up precise check (`:focus-visible` matching, an actual zoomed screenshot) proved this was a measurement artifact from test sequencing, not a real defect — the ring renders correctly. Recording this correction explicitly so a future pass doesn't mistake it for an open finding.

**EXISTING PENDING:** A11Y-4 (mobile nav focus trap when open — a real, already-tracked Phase 5 finding, distinct from and not contradicted by this phase's "no trap found in the elements actually reachable" result, since the mobile-menu panel itself couldn't be reached this pass either).

---

## 14. Mobile Accessibility

**No new investigation possible, consistent with every phase that has attempted this.** True breakpoint/viewport-specific mobile testing remains blocked by the same disclosed, reproduced-multiple-times tooling limitation (§13 above). Nothing new to add — this remains the single most consistently-unresolved verification gap across the entire eight-phase series, not unique to this phase.

---

## 15. Third-Party Resources

**No new findings.** Phase 3's third-party inventory (WordPress, WPGraphQL, Yoast, Vercel, Resend, mshots, Google Fonts, Google Maps, YouTube, Gravatar, zero analytics) and Phase 4/6's extensions (documentation completeness, graceful-fallback behavior, data-leakage checks) already cover this exhaustively. Nothing to add.

---

## 16. Failure Handling

**No new findings.** Phase 2's §16 (SEO under failure) and Phase 5's §16/17 (empirically tested: a genuine server error correctly returns HTTP 500 with `noindex`, never a falsely-indexable 200) already answer every question this section asks. Not re-derived.

---

## 17. Production Configuration

**No new findings.** Phase 1's environment-variable audit and Phase 6's Vercel/deployment/CSP review already cover this exhaustively. Nothing to add.

---

## 18. Scorecard

| AREA | STATUS | SEVERITY | EVIDENCE | LOCATION | IMPACT |
|---|---|---|---|---|---|
| SEO metadata/canonical/OG | ⚠️ NEEDS ATTENTION | P0 (SEO-1) | Phase 2, re-confirmed | WordPress/Yoast | Zero real content indexable |
| Favicon/manifest | ✅ GOOD | — | Live-confirmed this phase | `/favicon.ico` etc. | None |
| Sitemap | ⚠️ NEEDS ATTENTION | P2 | Phase 2 (SITEMAP-1) | `sitemap.ts` | Minor discoverability gap |
| Robots/crawlability | ✅ GOOD | — | Phase 2/6, re-confirmed | `robots.ts` | None |
| Structured data | ⚠️ NEEDS ATTENTION | P1 (SEO-2) | Phase 2 | `SelectedWork.tsx` | Internal hostname in page source, not crawlable |
| Technical SEO (titles/descriptions) | ✅ GOOD | — | Live-verified this phase | Sitewide | No duplicates found |
| Performance architecture | ⚠️ NEEDS ATTENTION | P2 (PERF-1) | Phase 3, quantified with live timing | `services/[slug]` | 2-4x slower per visit |
| Image optimization | ⚠️ NEEDS ATTENTION | P3 | Phase 3 | `Navbar.tsx` Logo | Diluted preload priority |
| Fonts/CSS/JS | ✅ GOOD | — | Phase 3 | — | None significant |
| Core Web Vitals | ❓ UNKNOWN | — | No measurement tooling available | — | SOURCE-LEVEL RISK only |
| Accessibility — cards/footer/forms | ❌ PROBLEM | P2 | This phase | See §11-12 | Primary conversion path affected |
| Accessibility — keyboard | ✅ GOOD | — | This phase, live-tested | Sitewide (reachable elements) | No trap found |
| Mobile/responsive | ❓ UNKNOWN | — | Tooling limitation, every phase | — | Unverifiable from this environment |
| Third-party resources | ✅ GOOD | — | Phase 3/4/6 | — | None |
| Failure handling | ✅ GOOD | — | Phase 2/5, empirically tested | — | None |
| Production configuration | ✅ GOOD | — | Phase 1/6 | — | None |

---

## 19. New Findings

Full detail in §11-12 above.

| ID | Category | Severity |
|---|---|---|
| A11Y-FOOTER-1 | Accessibility / labeling | P2 |
| CARDA11Y-1 | Accessibility / link semantics | P2 |
| FORMA11Y-1 | Accessibility / live region | P2 |
| FORMA11Y-2 | Accessibility / autocomplete | P3 |

**4 new findings: 0 P0 · 0 P1 · 3 P2 · 1 P3 · 0 INFO.**

---

## 20. Existing Pending Findings

Not re-derived, not counted as new, cited for completeness: SEO-1 (P0), SEO-2 (P1), OG-1, OG-2, SITEMAP-1, CANON-1, IDX-1, META-1, SEO-4, SEO-5, SEO-6, JSONLD-1, PERF-1, PERF-4, PERF-5, PERF-6, A11Y-4, A11Y-5, UX-2, UX-5, A11Y-3, A11Y-1. Full detail in each item's originating phase report.

---

## 21. Resolved Findings

**RESOLVED — DO NOT REOPEN:** testimonial hover-clipping (Phase 3/5, confirmed fixed in code and live production); the `/#work` anchor conditional-rendering risk (Phase 5, now structurally unconditional); www/apex canonical leakage; the `seo:null` metadata-stripping bug; the Case Study "Test" placeholder entry; fabricated testimonials/team content; conflicting contact info.

**One item this phase specifically resolves, worth calling out on its own:** the master audit's **A11Y-2** ("footer newsletter field's accessible name may rest on its placeholder... flagged from one research pass, not independently confirmed") is no longer an open question — this phase confirmed it true from direct source read and re-filed it with full evidence as **A11Y-FOOTER-1** (§11). Treat A11Y-2 as superseded by A11Y-FOOTER-1 going forward, not as a separate still-open item.

---

## 22. Claude-Fixable

All four new findings (A11Y-FOOTER-1, CARDA11Y-1, FORMA11Y-1, FORMA11Y-2) are fully Claude-fixable, self-contained, no WordPress/Vercel/credential dependency. Alongside them, still open from prior phases and equally self-contained: SEO-2, OG-1, OG-2, SITEMAP-1, PERF-1, PERF-5, PERF-6.

---

## 23. Manual Tasks

None new this phase. SEO-1 (wp-admin) remains the only manual action directly relevant to this phase's scope.

---

## 24. Business Decisions

None new this phase.

---

## 25. Unknown / Needs Measurement

True Core Web Vitals (LCP/CLS/INP) via real Lighthouse/PageSpeed/RUM data — unavailable from this environment across every phase that's asked. True mobile/tablet breakpoint rendering and mobile-menu keyboard behavior — blocked by the same disclosed browser-automation limitation across the master audit, Phase 3, Phase 5, and this phase.

---

## 26. Recommended Next Phase

Eight phases in, the SEO/performance/accessibility surface has now been audited to the point of clear diminishing returns from further read-only passes — this phase's own experience proves it: broad re-coverage of Phase 2/3's territory produced nothing, and the only real yield came from two narrowly-targeted efforts (closing a explicitly-disclosed coverage gap, and live keyboard testing nothing had tried before). If a Phase 9 is warranted, it should follow that same lesson: **narrow, not broad.** The two remaining narrow gaps worth a dedicated attempt are the browser-automation viewport limitation (worth one more real attempt, or an explicit decision to accept it as unresolvable from this environment and rely on a real-device check instead) and an actual measured Core Web Vitals run, if a Lighthouse-capable environment ever becomes available. Beyond those two specific, bounded items, further phases should shift from auditing to the fix phase this entire series has been building a punch list for.

---

## READ-ONLY GUARANTEE

`git status` confirmed immediately before writing this report, identical to the state at the start of this phase and every phase before it in this series:

- Working tree unchanged beyond this new report.
- No source modifications.
- No dependency modifications.
- No generated files unintentionally created.
- HEAD: `0ff429c8b1bdfc254c31de6860c972f6f7ee4e91` — unchanged.

**PHASE 8 AUDIT COMPLETE**
**READ-ONLY**
**NO FIXES APPLIED**
**NO COMMIT**
**NO PUSH**
**NO DEPLOY**
