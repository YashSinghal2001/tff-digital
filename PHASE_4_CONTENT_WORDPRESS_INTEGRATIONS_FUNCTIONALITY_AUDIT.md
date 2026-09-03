# PHASE 4 — DEEP PRODUCTION CONTENT + WORDPRESS CMS + INTEGRATIONS + FUNCTIONALITY AUDIT

**Audit Date:** 2026-09-02
**Scope:** Verification-only. This report contains ONLY findings new to Phase 4 — it does not restate, re-list, or merge in Phase 1/2/3 findings, which remain tracked in their own reports. Prior-phase facts appear here only as regression-check context.
**Repository State:** `tff-digital @ main`, `0ff429c8b1bdfc254c31de6860c972f6f7ee4e91` — unchanged throughout (confirmed §23).

---

## 1. Executive Summary

Three prior phases audited this project's code, architecture, dependencies, security, performance, and SEO mechanics in exhaustive depth. Phase 4 asked a different question: what does the site actually *say*, and does WordPress's actual content structure hold up the way the frontend assumes it does? Both questions turned up real, previously-undiscovered findings — and one of them is more consequential than anything surfaced in the first three phases combined.

**The headline finding (§10, CONTENT-Q1/Q2/Q3):** A careful, full read of the live site's actual text found that the homepage and About/Services pages state contradictory numbers for something as basic as how many service disciplines the agency offers ("Sixteen" vs. "Nine"), and — more seriously — the About page's "Our Story" section and the homepage hero both make enterprise-scale claims (40+ operators, four continents, $480M+ revenue influenced, 320+ projects delivered, 98% client satisfaction) that directly contradict the *same pages'* own honest, verified content: a real 6-person team roster shown a few sections later, and a real Upwork trust badge showing 72 total jobs and 9,444 hours — a small, genuine freelance/agency history, not a global operation. This reads as unedited generic-agency template copy that was never reconciled against the real business, sitting inches away from the site's own credible, verifiable proof points. This is a trust problem, not a technical one, and it's now documented with exact quotes and locations.

**The most consequential technical finding (§5, WP-1):** WordPress's REST schema marks *zero* fields required on Case Study or Service content, and the `featured_on_homepage` field defaults to `true`. An editor can publish a case study with only a title filled in and it will automatically surface on the homepage's most prominent section with no other review gate — and this isn't hypothetical: the already-known "THIS IS LIVE DESCRIPTION TEST" service entry is live, standing proof this exact gap has already been exercised in production.

**Also new this phase:** a real, live, user-facing bug where 6 of the 7 real WordPress services show a generic fallback icon because the icon-selection code was built for a different, older set of service slugs (§4, PARITY-1); a genuine data-loss risk in the lead pipeline if WordPress's alternate "email-only" storage mode is what's actually configured live (§7, LEAD-1); one service page with a completely empty body description, distinct from and worse than the already-known placeholder-copy issue (§10, CONTENT-Q5); a literal unfilled `[GOVERNING JURISDICTION]` template placeholder live in both legal documents (§10, CONTENT-Q6); FAQ answers missing from the server-rendered HTML for every question except the first, sitewide (§10, CONTENT-Q4); and a severely stale internal document (`MIGRATION_REPORT.md`) that now actively states the opposite of the current architecture (§15, DOCS-1).

**No regressions found** in any previously-closed item re-checked this phase (CMS-boundary leak surface, production-vs-repository consistency, preview-auth behavior, newsletter-stub status).

**Scorecard, this phase's new findings only:** 0 P0 · 3 P1 · 7 P2 · 5 P3 · 6 INFO — **21 total new findings.**

---

## 2. Scope + Methodology

Five parallel research passes plus this orchestrating pass, each combining live read-only HTTP/GraphQL/REST requests against `https://www.tffdigital.com` and `https://cms.tffdigital.com`, direct source reading, and — for the content-quality pass specifically — a genuine full read of every word of live rendered copy across every real page, the first pass in this audit series to do so. Nothing was fixed, modified, submitted, installed, committed, or deployed. No real contact-form lead or newsletter signup was submitted anywhere. No WordPress content, setting, or plugin was changed. Every claim below is either live-verified, source-verified, or explicitly marked **NOT VERIFIABLE FROM THIS ENVIRONMENT**.

---

## 3. WordPress Content Inventory

Live `GET /wp-json/wp/v2/types` confirms **no custom post type exists beyond what prior phases already documented**: `post`(1), `page`(6, all dormant), `service`(7), `testimonial`(1), `team`(1), `faq`(1), `projects`(6), `case-study`(2), plus `attachment`(22 media items). Taxonomies: `category`(1 real term, "seo"), `post_tag`(**0 terms**). `tff_lead` re-confirmed unexposed via REST.

**New this phase:** Testimonial, Team, FAQ, and Projects are **all four actually registered and queryable in WPGraphQL** (`testimonials`, `teamMembers`, `fAQs`, `projects` root fields all return real, live data), not just Projects as prior phases established. Keeping Testimonials/Team/FAQ as static frontend data is therefore a pure product decision with zero technical barrier on WordPress's side — the pipe already exists for all four, ready to use if that decision ever changes.

#### CONTENT-INV-1 — Dormant WordPress Pages confirmed empty; slugs collide with live routes
- **Category:** Content Inventory. **Priority: P3/INFO.**
- **Exact location:** WordPress `page` post type, 6 entries (`home`, `about`, `services`, `portfolio`, `blog`, `contact`).
- **Evidence:** All 6 fetched live — every one has `content.rendered` of zero length. Their slugs are byte-identical to real, live Next.js route segments.
- **Production impact:** None today. The finding is a forward-looking one: if this dormant layer is ever wired to a generic `/[slug]` pattern in the future, it would immediately collide with already-built static routes.
- **Claude Can Fix:** N/A, no action needed now. **Manual/User Needed:** NO — informational, worth knowing before ever activating this layer.

#### CONTENT-INV-2 — Zero WordPress tags exist; `/blog/tag/[slug]` is content-dormant, not broken
- **Category:** Content Inventory. **Priority: P3/INFO.**
- **Evidence:** `GET /wp-json/wp/v2/tags` → `X-WP-Total: 0`. The route itself works correctly (a fabricated tag slug live-tested this phase correctly 404s).
- **Production impact:** None — this precisely explains part of Phase 2's already-tracked sitemap gap: there is currently no real tag page that could even be in the sitemap. If a post is ever tagged, the route activates with zero code change needed.
- **Claude Can Fix:** N/A. **Manual/User Needed:** NO — informational only.

---

## 4. WordPress → Next.js Parity

Field-level trace built by comparing live REST ACF output (which exposes every field regardless of GraphQL query selection) against the actual GraphQL fragments and adapters for Case Study, Service, and Blog Post.

**Verified clean, no findings:** `adaptCaseStudyResults()` correctly requires both label AND value before rendering a stat pair — a partial result field is safely dropped, not rendered broken. `relatedServices` is a genuine, correctly null-safe WPGraphQL relationship field (currently unpopulated on both real case studies — a content gap, not a code one). `featuredOnHomepage` is a real ACF boolean, correctly fetched and correctly filtered on the homepage (capped at 4) — precisely working as designed. Blog post field set (author, categories, tags, featured image) fetched completely, no drops found.

#### PARITY-1 — Service `icon` field fetched and adapted but never rendered; the real icon comes from a hardcoded table built for different, older slugs
- **Category:** Data Parity. **Priority: P2.**
- **Exact location:** `src/services/service-offering.queries.ts:22-26` (fetch), `src/adapters/service-offering.adapter.ts:19-21` (map), `src/app/services/[slug]/page.tsx:21,89` (actual render), `src/lib/content/service-icons.ts` (the hardcoded dictionary actually used).
- **Evidence:** The real WordPress `icon` Media field is correctly fetched and adapted (confirmed populated on 1 of 7 real services via live REST). A repo-wide search found **zero usages of this adapted field anywhere in components/sections/app**. The detail page instead renders via `getServiceIcon(slug)`, a 15-entry hardcoded slug→Lucide-icon dictionary whose keys (`seo`, `smm`, `google-meta-ads`, `branding`, ...) match `src/data/temporary-services.ts`'s old placeholder listing, not the 7 real WordPress slugs (`ai-consulting`, `digital-marketing`, `wordpress-development`, `ai-automation`, `seo-optimization`, `ui-ux-design`, `web-development`). Only `web-development` happens to appear in both lists.
- **Production impact:** Live, user-facing: **6 of the 7 real, currently-published services render a generic `Sparkles` fallback icon** on their detail pages, structurally, regardless of whether WordPress's own `icon` field is ever filled in.
- **Recommendation:** Wire the real `service.icon` field into the detail page (replacing or supplementing `getServiceIcon`), or rebuild the icon dictionary's keys to match the real WordPress slugs.
- **Claude Can Fix:** YES. **Manual/User Needed:** NO.

#### PARITY-2 — Case-study `results` field exists in the WordPress/WPGraphQL schema but is never queried
- **Category:** Data Parity. **Priority: P3.**
- **Evidence:** A live ACF field literally named `results` exists (distinct from the 4 `result1-4Label/Value` stat pairs, currently empty everywhere); a direct GraphQL query for it succeeds (returns `null`, not a schema error), confirming it's real and registered. The app's `CASE_STUDY_FIELDS` fragment never requests it.
- **Production impact:** None today (empty everywhere), but an editor seeing this field in wp-admin would reasonably expect it to appear somewhere live — it structurally never will as currently wired.
- **Recommendation:** Either wire it in if it has an intended purpose, or treat it as a deliberate dead field — a product call either way, not a code defect.
- **Claude Can Fix:** YES, if wiring is wanted. **Manual/User Needed:** NO for the code question; whether to use the field at all is a content call.

---

## 5. Editor Experience

#### WP-1 — Zero required fields on Case Study or Service; "featured on homepage" defaults to true
- **Category:** Editor Experience / Content Safety. **Priority: P2.**
- **Exact location:** WordPress ACF field-group configuration for `case-study` and `service` post types (live-observed via `OPTIONS /wp-json/wp/v2/case-study` and `/service`).
- **Evidence:** Every single ACF field on both content types (`client_name`, `project_url`, `short_summary`, `challenge`, `solution`, `short_description`, `description`, everything) reports `"required": false` in WordPress's own live REST schema — no enforcement beyond the built-in title exists anywhere. Separately and more consequentially: **`featured_on_homepage` has `"default": true`.** Combined, an editor can publish a case study with only a title filled in, and it will automatically appear in the homepage's "Selected Work" section (capped at 4, no other review gate) unless they actively notice and uncheck a box that defaults the unsafe way. This is not theoretical: the already-known live "THIS IS LIVE DESCRIPTION TEST" service entry is direct, standing proof this exact class of gap has already been exercised in production.
- **Also confirmed:** `project_url` carries only a `"format": "uri"` schema hint, no server-side enforcement — WordPress will save any string here, including a malicious scheme. This is the WordPress-side half of why Phase 3's already-tracked SEC3-1 (the case-study "Visit project" link's missing frontend scheme validation) matters as much as it does: there is no WordPress-side backstop at all, so frontend validation is the only enforcement layer anywhere in the pipeline.
- **Production impact:** Real editorial risk for future content — an incomplete or not-ready case study could silently go live on the site's most prominent surface with no warning to the editor.
- **Recommendation:** Change `featured_on_homepage`'s ACF default to `false` (opt-in rather than opt-out); consider marking core narrative fields (`short_summary`, `challenge`, `solution`) required in ACF's field-group settings if a hard editorial guardrail is wanted.
- **Claude Can Fix:** PARTIAL — Claude can prepare exact written wp-admin instructions but cannot apply an ACF configuration change without WordPress access. **Manual/User Needed:** YES — WordPress admin, ACF field-group settings.

---

## 6. View/Preview Audit

**Fast regression spot-check, live, today — 3/3 PASS, no regression:** wrong-secret request to `/api/preview/case-study` → 401 unchanged; `?preview=true` with no cookie on a real published case-study URL → ordinary published page, unchanged; live `OPTIONS` on the WordPress leads REST endpoint → identical arg schema to Phase 3.

**New, previously-unasked questions, both answered from source, both sound:**

- **Deleted/non-existent content in the preview flow** — read `case-study/route.ts` in full: a genuine WordPress/network failure is caught and returns a generic error (no detail leak); a non-existent/deleted id resolves to `caseStudy: null`, which the route correctly turns into a clean 404. Neither path produces a raw stack trace. **Category: INFO / Working as designed.** (The "specifically-trashed-post" sub-case remains **NOT VERIFIABLE FROM THIS ENVIRONMENT** — no safe way to create/trash real WordPress test content.)
- **The `isPlaceholderCaseStudySlug` filter is genuinely exercised in the preview path too**, not just the public view path (`route.ts:52`: the same line handling not-found also 404s a "Test"-placeholder slug if previewed by database ID) — a previously-undocumented, well-designed defensive detail. **Category: INFO / Working as designed.**

---

## 7. Contact/Lead Audit

Cited from Phase 1/3's exhaustive same-session sweeps rather than redone: environment-variable scoping (all server-only, zero client leak — no new finding), and email-delivery verifiability, which is confirmed here explicitly as **MANUAL, required action: confirm Vercel Production values + `wp-config.php`'s storage constant, then submit one real test lead and confirm both storage and email arrival** — this is FORM-1 (already tracked), restated once for this report's own structure, not a new discovery.

#### LEAD-1 — WordPress's alternate "email-only" lead-storage mode leaves zero admin-visible record if email fails
- **Category:** Forms / Data-Loss Risk. **Priority: P2.**
- **Exact location:** `wordpress-plugin/tff-headless-leads/tff-headless-leads.php:243-263`.
- **Evidence:** The `tff_lead` CPT (with a real admin menu and a working detail metabox showing all 8 lead fields) is registered **only** `if (TFF_LEAD_STORAGE_METHOD === 'cpt')`. If the live host is instead configured for the plugin's other documented option, `'email'` (its actual live value is unknown from this repo, per master audit §7), the registration callback returns early — **no CPT, no admin menu, no lead record of any kind is ever created in WordPress.**
- **Production impact:** This sharpens the existing FORM-1 finding with the missing mechanism: FORM-1 already establishes a WordPress-save-succeeds/email-silently-fails split is architecturally possible. This finding adds that **if the live host is actually in `'email'` mode, a silently-failed notification email means the lead's data no longer exists anywhere at all** — not merely inconvenient to find, genuinely gone. In `'cpt'` mode, by contrast, the lead stays safely recorded and visible even if the email fails.
- **Recommendation:** Confirm which storage mode the live host actually uses (the same `wp-config.php` check FORM-1 already calls for). If `'email'`, consider switching to `'cpt'` (or both) as a safety net against email delivery failure, independent of whatever FORM-1's own email investigation concludes.
- **Claude Can Fix:** NO — WordPress config, not application code. **Manual/User Needed:** YES — `wp-config.php` check + a storage-mode decision.

**Lead data completeness — no gap found.** Live REST arg schema (8 fields) cross-checked against the CPT's stored meta and the admin metabox's displayed rows: full 1:1 parity, nothing silently dropped either direction.

---

## 8. Newsletter Audit

**Confirmed, no new investigation needed, stated once for this report's structure:** both entry points (`Footer.tsx`, `NewsletterSection.tsx`) have zero connection to Resend, WordPress, or any other provider — pure client-side state only, exactly matching Phase 3's already-established finding. No new findings.

---

## 9. Forms + Interactive Functionality

Live crawl of all 21 real production routes, full link/href extraction from each. **No dead buttons, no broken internal links, no incorrect hrefs found anywhere.** `mailto:info@tffdigital.com` / `tel:+917206809816` confirmed consistent across all 21 pages. All social hrefs well-formed. Zero `href="#"` dead-end anchors anywhere. Both case-study external Project URLs re-verified live 200. All CTA buttons resolve to real destinations. In-page anchors have real matching DOM ids. Breadcrumbs resolve correctly. Mobile-menu/responsive interaction: not live-tested — Phase 3's already-established viewport-tool unreliability applies, nothing new to add.

#### ROUTE-1 — Blog search is genuinely functional (positive, previously untested either way)
- **Category:** Forms/UX. **Priority: INFO.**
- **Evidence:** Live-tested `/blog?q=seo` → returns the real post; `/blog?q=zzzznomatch123` → server round-trips the value into the input and correctly renders a "No results found" empty state, not a fallback post.
- **Recommendation:** None needed — recording as verified-working so it isn't mistakenly assumed untested or stubbed in a future pass. **Claude Can Fix:** N/A. **Manual/User Needed:** NO.

#### ROUTE-2 — Zero real WordPress tags exist; refines Phase 2's sitemap-gap finding with the precise reason
- Same underlying fact as **CONTENT-INV-2** above, cross-referenced here since Phase 4's brief lists it under both sections. Not a separate defect.

No additional CMS/Vercel/localhost URL leakage found beyond what prior phases already track (SEO-2's homepage leak, re-confirmed unchanged in §13).

---

## 10. Production Content Audit

This is the section where a genuine full read of live copy — not code or architecture — surfaced this phase's most important findings.

#### CONTENT-Q1 — Homepage's own "disciplines" count contradicts every other page
- **Category:** CONTENT BUG. **Priority: P1.**
- **Exact location:** `/` ("Sixteen disciplines, one integrated system...") vs. `/about` ("...spanning **nine** disciplines...") vs. `/services` ("**Nine** disciplines. One growth engine.").
- **Evidence:** Verified by direct comparison across all 10 fetched pages — homepage says "Sixteen," both other pages independently say "Nine." Neither number matches the ~5 services actually shown in either page's own service grid.
- **Production impact:** A visitor moving from the homepage to `/services` — a completely plausible, common path — sees the same claim stated as two different numbers within one click.
- **Recommendation:** Reconcile to one number sitewide, ideally matching however many services are actually live.
- **Claude Can Fix:** PARTIAL (making it consistent is trivial; which number is correct is a business call). **Manual/User Needed:** YES.

#### CONTENT-Q2 — About page's "Our Story" makes enterprise-scale claims that contradict the same page's own team roster
- **Category:** CONTENT BUG. **Priority: P1.**
- **Exact location:** `/about`, "— OUR STORY" section and its stat row, vs. the same page's own "— OUR TEAM" section.
- **Evidence:** *"We're now 40+ operators strong, spanning nine disciplines, working with venture-backed startups through mid-market brands across four continents."* Stat row: *"210+ Brands scaled," "$480M+ Revenue influenced," "40+ Senior operators," "94% Retention."* Culture section: *"Remote-first across 12 countries."* The **same page's own** Team section lists exactly **6 named people**, and the site's own verified Upwork trust badge (elsewhere on the site) shows 72 total jobs and 9,444 hours — a small, real freelance/agency history, not a global operation.
- **Production impact:** The single most consequential finding in this audit. A prospect scrolling from "40+ operators across four continents" to a 6-person team photo a few sections later, on the same page, has good reason to distrust every other claim on the site — including the real, verifiable ones sitting right next to it.
- **Recommendation:** Rewrite "Our Story" to match the real, honest, 6-person team already shown truthfully elsewhere on the same page.
- **Claude Can Fix:** NO — pure copywriting/business-truth question. **Manual/User Needed:** YES — business decision on the honest team/scale story, then a copy rewrite.

#### CONTENT-Q3 — Homepage hero stats and unattributed campaign stats contradict the site's own real numbers
- **Category:** CONTENT BUG. **Priority: P1.**
- **Exact location:** `/`, hero section and stat callouts throughout the page.
- **Evidence:** Hero: *"320+ Projects Delivered," "98% Client Satisfaction," "12+ Year Experience"* — appearing a few sections above the page's own real Upwork badge (*"72 Total Jobs," "9,444 Total Hours"*). A separate cluster — *"4.2X ROAS Increase," "CRO +64%," "3.8X Lead Generation Growth," "68% Reduction in CPA," "Leads 1,932+," "+127% Revenue Growth"* — carries zero client attribution and doesn't match either real case study's actual published numbers (ChicaBebo: 382/134K/2.87K/2.1%; RoyaltyMirror: 7.7K/14.8K/14.7K/$29.6K).
- **Production impact:** Same self-contradiction pattern as CONTENT-Q2 — "320+ Projects" a few sections above a verifiable "72 Total Jobs." Reads as generic template/demo filler never wired to real client data.
- **Recommendation:** Attribute every stat to a real, nameable engagement, or replace with the two real case studies' own numbers, already proven live elsewhere on the site.
- **Claude Can Fix:** NO — content/business-truth question. **Manual/User Needed:** YES — decide which numbers are real and sourceable.

#### CONTENT-Q4 — FAQ answers missing from server-rendered HTML for every question except the first, sitewide
- **Category:** DESIGN ISSUE. **Priority: P2.**
- **Exact location:** Every page carrying an FAQ block — `/`, `/about`, all 7 `/services/[slug]` pages, and `/services`'s own distinct question set — at least 10 live URLs.
- **Evidence:** Raw HTML inspection: the first question's button has `aria-controls="faq-answer-0"` with a genuinely matching `<p id="faq-answer-0">` element containing the real answer text. Every subsequent question (`faq-answer-1`, `-2`, `-3`...) has **no corresponding element with that ID anywhere in the initial HTML at all** — confirmed by direct string search on the raw response, not a CSS-hidden state.
- **Production impact:** Only 1 of each page's FAQ answers is present in what a non-JS-executing consumer sees, meaningfully reducing crawlability/completeness sitewide; also means the already-tracked future `FAQPage` JSON-LD opportunity currently has no crawlable answer text to draw from beyond one Q&A per page.
- **Recommendation:** Render all FAQ answers in the initial HTML (collapsed via CSS/`hidden`, not by omitting the element).
- **Claude Can Fix:** YES. **Manual/User Needed:** NO.

#### CONTENT-Q5 — `/services/ai-consulting` has a completely empty body description
- **Category:** CONTENT BUG (distinct from and more severe than the already-tracked test-copy finding, which concerns `web-development`'s copy, not this).
- **Priority:** P2.
- **Evidence:** The page's header contains only an icon and `<h1>AI Consulting Updated</h1>` — no description paragraph anywhere before the FAQ section begins. All 6 other real service pages have at least some body text.
- **Production impact:** A visitor lands on a title, then immediately an FAQ block — no explanation of the service at all.
- **Recommendation:** Add real body content for this one entry, folded into the same editorial pass already planned for the other 6 services.
- **Claude Can Fix:** NO — needs the WordPress field populated. **Manual/User Needed:** YES.

#### CONTENT-Q6 — Unfilled template placeholder live in both legal documents
- **Category:** CONTENT BUG / MANUAL CONTENT TASK. **Priority: P2.**
- **Exact location:** `/privacy-policy` §10, `/terms-and-conditions` §12.
- **Evidence:** Privacy: *"Additional rights may apply to you under **[GOVERNING JURISDICTION]** privacy law."* Terms: *"These Terms shall be governed by the laws of **[GOVERNING JURISDICTION]**..."* Both documents also explicitly self-disclose as an unreviewed *"general information template... not a substitute for professional legal advice."*
- **Production impact:** The legal documents currently governing every contact-form submission contain a literal unfilled bracket token.
- **Recommendation:** Fill in the actual jurisdiction (likely India, given the business address); flag the "unreviewed template" self-disclosure as its own decision on whether real legal review is warranted.
- **Claude Can Fix:** YES for the placeholder substitution once told the answer; NO for determining the jurisdiction or obtaining review. **Manual/User Needed:** YES.

**Confirmed still accurate on fresh reading, not new findings:** contact email/phone 100% consistent across all 16 pages checked; the Upwork testimonials read as genuine and varied; the About page's 6 team bios read as authentic; both real case studies' body copy is clean and professional with no template artifacts; the one real blog post is substantive and well-written.

---

## 11. Route/URL Audit

All 21 real routes return 200. Fake category/tag slugs correctly 404. Trailing-slash spot-checks on 4 additional routes all correctly 308-redirect, consistent with Phase 2's already-established pattern. Zero `vercel.app`, zero `localhost`/`127.0.0.1` anywhere across all 21 pages. No new route-level findings beyond ROUTE-1/ROUTE-2 above (§9).

---

## 12. External Integrations

Phase 3 already produced a complete third-party inventory; this section only answers the new angles Phase 4's brief adds. **No new problems found.** Documentation-in-repo: Resend, WordPress preview auth, Google Maps/YouTube, and mshots/Gravatar are all explained via comments at their point of configuration; Yoast and Vercel are self-evident from context and don't need explicit documentation. Graceful-fallback: Google Maps and YouTube are both iframe embeds — a failed load is contained inside the iframe's box, never a page-level crash. Data-leak check: the Maps embed URL is a static query string with no visitor-specific data appended beyond what any iframe load inherently involves. No finding filed for any of this — all confirmed sound.

---

## 13. CMS/Frontend Domain Boundary

**Regression check only, per this phase's own instruction — PASS, no regression.** Live homepage fetch today shows `cms.tffdigital.com` 12 times, matching the master audit's own characterization exactly — same mechanism (the already-tracked SEO-2 hydration-payload leak via `SelectedWork`'s unused `seo` prop), not worse, still not inside the crawlable JSON-LD script block. `/about`, previously characterized as clean, re-confirmed clean (0 occurrences). No new leak surface found.

---

## 14. Production/Repository Consistency

**Regression check only — PASS, no drift.** HEAD confirmed `0ff429c`, identical to every prior phase this session. Live `Cache-Control`/`x-vercel-cache` behavior fetched fresh today matches the rendering-mode pattern Phase 3 established from build output exactly (`/` → static/ISR, `HIT`; `/case-studies` and a service detail page → dynamic, `MISS`). Production genuinely reflects current HEAD's code — no "deployed build is stale" risk found.

---

## 15. Documentation/Operations

#### DOCS-1 — `MIGRATION_REPORT.md` is severely stale and now actively contradicts the current architecture
- **Category:** Documentation. **Priority: P2.**
- **Exact location:** `/MIGRATION_REPORT.md` (repo root, 275 lines).
- **Evidence:** States in present tense, with no historical/superseded marker: *"the `CaseStudy` and `PortfolioItem` post types do not exist on the live WordPress GraphQL schema at all"* and that `SelectedWork.tsx` was *"Reverted to hardcoded — no live backend support."* Both are now false — Case Studies are fully WordPress-driven with 2 real published entries and a complete, well-tested pipeline (confirmed repeatedly across the master audit and Phases 1-3). It also claims Testimonial/Team/FAQ have "no content types... on either side," which this phase's own §3 finding disproves — they exist and are queryable.
- **Production impact:** None directly (a doc, not executed code), but a new developer or a future Claude session reading this file at face value would form a fundamentally incorrect picture of the codebase's actual data-source architecture.
- **Recommendation:** Add a header banner noting the file is a superseded, point-in-time historical record, or fold its still-relevant parts (the fragment-deduplication bug-fix rationale) into a maintained document and archive the rest.
- **Claude Can Fix:** PARTIAL — can add a superseded-banner; deciding what's worth preserving is a judgment call. **Manual/User Needed:** NO beyond confirming the approach.

#### DOCS-2 — `README.md` is unmodified `create-next-app` boilerplate
- **Category:** Documentation. **Priority: P3.**
- **Evidence:** Entirely generic starter content — no mention of WordPress, the headless architecture, required env vars, or preview setup.
- **Recommendation:** Replace with project-specific setup steps, even briefly.
- **Claude Can Fix:** YES. **Manual/User Needed:** NO.

#### DOCS-3 — No WordPress plugin installation/setup runbook exists anywhere
- **Category:** Documentation/Operations. **Priority: P3.**
- **Evidence:** `wordpress-plugin/` contains only PHP source and a packaged zip — no README. `.env.example`'s comments point to the plugin file for the preview-secret constant name, but nothing documents the actual install/update procedure for a plugin load-bearing for the leads endpoint, all View/Preview routing, and CMS noindex hardening.
- **Recommendation:** A short runbook: package/upload steps, the `wp-config.php` constants that need setting, and post-update verification.
- **Claude Can Fix:** YES, can draft from what's already known about the plugin. **Manual/User Needed:** NO for drafting; wp-admin/hosting access needed to verify end-to-end.

#### DOCS-4 — Four large audit-report documents now exist with no index between them
- **Category:** Documentation Hygiene. **Priority: INFO.**
- **Evidence:** `docs/TFF_DIGITAL_MASTER_AUDIT.md` plus this session's own `PHASE_1`/`PHASE_2`/`PHASE_3` reports at repo root — no file links to or indexes the others.
- **Recommendation:** Once the audit series concludes, a short index pointing to each phase report would help future reference. Explicitly not a recommendation to delete or merge anything.
- **Claude Can Fix:** YES. **Manual/User Needed:** NO.

---

## 16. Findings Table

Phase 4 new findings only — not merged with prior phases.

| ID | Category | Priority | Finding | Claude Fix? | Manual/User? |
|---|---|---|---|---|---|
| CONTENT-Q2 | Content | P1 | About page's scale claims contradict its own team roster | NO | YES |
| CONTENT-Q3 | Content | P1 | Homepage hero/campaign stats contradict real Upwork/case-study numbers | NO | YES |
| CONTENT-Q1 | Content | P1 | "Sixteen" vs "Nine" disciplines contradiction | PARTIAL | YES |
| WP-1 | Editor Experience | P2 | No required fields; homepage-featured defaults true | PARTIAL | YES |
| PARITY-1 | Data Parity | P2 | Real service icons unused; 6/7 services show fallback icon | YES | NO |
| LEAD-1 | Forms | P2 | 'email' storage mode = total data loss if email fails | NO | YES |
| CONTENT-Q4 | Design | P2 | FAQ answers missing from SSR HTML except first, sitewide | YES | NO |
| CONTENT-Q5 | Content | P2 | `/services/ai-consulting` has zero body description | NO | YES |
| CONTENT-Q6 | Content | P2 | Unfilled `[GOVERNING JURISDICTION]` in both legal docs | YES (text)/NO (jurisdiction) | YES |
| DOCS-1 | Documentation | P2 | `MIGRATION_REPORT.md` actively contradicts current architecture | PARTIAL | NO |
| CONTENT-INV-1 | Content Inventory | P3 | Dormant Pages empty; slug collision risk if activated | N/A | NO |
| CONTENT-INV-2 | Content Inventory | P3 | Zero WP tags exist; tag route content-dormant | N/A | NO |
| PARITY-2 | Data Parity | P3 | Case-study `results` field exists, never queried | YES | NO |
| DOCS-2 | Documentation | P3 | README is unmodified boilerplate | YES | NO |
| DOCS-3 | Documentation | P3 | No WordPress plugin runbook | YES | NO |
| ROUTE-1 | Forms/UX | INFO | Blog search confirmed genuinely functional (positive) | N/A | NO |
| ROUTE-2 | Content/Architecture | INFO | Same fact as CONTENT-INV-2, cross-referenced | N/A | NO |
| DOCS-4 | Documentation Hygiene | INFO | 4 audit reports, no index between them | YES | NO |
| — | Preview | INFO | Deleted-content preview handling confirmed clean | N/A | NO |
| — | Preview | INFO | Placeholder-slug filter confirmed reused in preview path | N/A | NO |
| — | Content Inventory | INFO | Testimonial/Team/FAQ confirmed fully WPGraphQL-queryable already | N/A | NO |

**21 new findings: 0 P0 · 3 P1 · 7 P2 · 5 P3 · 6 INFO.**

---

## 17. Manual Tasks

**P1:** CONTENT-Q1 (reconcile disciplines count — business call on the real number), CONTENT-Q2 (rewrite "Our Story" to match the real team), CONTENT-Q3 (decide which stats are real/sourceable).
**P2:** WP-1 (ACF field-group changes in wp-admin), LEAD-1 (`wp-config.php` storage-mode check + decision), CONTENT-Q5 (write real service description), CONTENT-Q6 (confirm governing jurisdiction, consider real legal review).

---

## 18. Claude-Fixable Tasks

**P2:** PARITY-1 (wire real service icons or fix the dictionary), CONTENT-Q4 (render all FAQ answers in initial HTML), CONTENT-Q6's placeholder substitution (once told the jurisdiction), DOCS-1's superseded-banner.
**P3:** PARITY-2 (wire or formally retire the `results` field), DOCS-2 (write a real README), DOCS-3 (draft a plugin runbook), DOCS-4 (add a cross-report index).

---

## 19. Business Decisions Required

- What is the site's actual, honest scale story (team size, geographic reach, years operating) — needed to resolve CONTENT-Q1, CONTENT-Q2, and CONTENT-Q3 together, since all three stem from the same root cause: unreconciled template marketing copy sitting next to the real business.
- Which specific campaign/performance stats (the "4.2X ROAS," "68% Reduction in CPA" cluster) are real and attributable, versus should be removed.
- WordPress's lead-storage mode (`'cpt'` vs `'email'`) — a real operational choice with the data-loss implications LEAD-1 describes.
- Whether `/privacy-policy` and `/terms-and-conditions` need actual legal review, given the pages' own self-disclosure that they haven't had any.

---

## 20. Already-Correct / Closed Items

Re-verified this phase, all holding, zero regressions: CMS-boundary leak surface (only the already-known SEO-2 mechanism, not worse); production genuinely reflects current repository HEAD; preview-auth behavior (wrong-secret, cosmetic `?preview=true`, deleted-content handling all sound); newsletter forms remain pure UI stubs with zero backend connection; all 21 real routes return correct status codes with no dead links or incorrect hrefs found anywhere; contact email/phone consistency holds across every page checked; both real case studies' and the one real blog post's body copy read as genuine and professional; the Upwork testimonials and team bios read as authentic; third-party integrations all have adequate documentation and graceful failure modes.

---

## 21. Unknown / Not Verifiable

- Whether the live host's `TFF_LEAD_STORAGE_METHOD` is actually `'cpt'` or `'email'` (LEAD-1's central open question) — not visible from this repository.
- Email delivery for the contact form (FORM-1, restated in §7) — cannot be proven without a real test submission.
- WordPress's `asPreview` resolver's behavior on a specifically-trashed (not merely deleted) post — would require creating and trashing real WordPress test content, outside safe scope.
- Whether the CONTENT-Q1/Q2/Q3 marketing copy was ever intentional (a deliberate, if risky, positioning choice) versus genuinely unedited template filler — this report describes what's live and its internal contradictions, not the intent behind it.

---

## 22. Recommended Next Audit (Phase 5)

Given four phases now cover architecture, dependencies, code quality, SEO, security, performance, accessibility, UI, WordPress content, and functionality — the natural remaining gap is **live, human-in-the-loop verification of the things no automated or read-only pass can safely test**: submitting one real contact-form lead and confirming both WordPress storage and email delivery end-to-end (FORM-1/LEAD-1); an actual screen-reader pass (VoiceOver/NVDA) rather than accessibility-tree inference; true mobile-device testing to finally resolve the viewport-tool limitation that's blocked real breakpoint verification across every phase so far; and a business/content review session to resolve CONTENT-Q1/Q2/Q3's open questions about the site's real positioning. A Phase 5 focused on "manual verification of what Claude cannot safely test alone" would close out nearly everything left open across all four phases.

---

## 23. Git Safety

Confirmed via fresh `git status`/`git diff --stat`/`git rev-parse HEAD` immediately before writing this report and matching the check run at the start of this phase:

- **Files changed:** NO.
- **Files created:** YES — exactly one, this report.
- **Files deleted:** NO, by this session. (The working tree's 11 pre-existing unstaged `docs/*.md` deletions, already disclosed and unchanged since Phase 3's own git-safety section, remain exactly as they were — no further drift this phase.)
- **Staged:** NO.
- **Commit:** NO.
- **Push:** NO.
- **HEAD:** `0ff429c8b1bdfc254c31de6860c972f6f7ee4e91`, unchanged throughout.

---

**PHASE 4 AUDIT COMPLETE**
**NO CODE MODIFIED**
**NO CONFIG MODIFIED**
**NO WORDPRESS CONTENT MODIFIED**
**NO COMMIT**
**NO PUSH**

**21 new findings discovered: 0 P0 · 3 P1 · 7 P2 · 5 P3 · 6 INFO.**
**What remains UNKNOWN:** the live WordPress lead-storage mode; email delivery proof; trashed-post preview behavior; the intent behind the content contradictions in §10.
**Recommended Phase 5:** human-in-the-loop verification — a real test lead submission, a real screen-reader pass, real mobile-device testing, and a business review session for the content contradictions this phase found.
