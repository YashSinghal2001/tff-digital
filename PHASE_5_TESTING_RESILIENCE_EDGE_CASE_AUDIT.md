# PHASE 5 — DEEP TESTING + ERROR HANDLING + RESILIENCE + PRODUCTION EDGE-CASE AUDIT

**Audit Date:** 2026-09-02
**Scope:** Read-only. Does the application behave correctly not only when everything works, but when something goes wrong? This report contains ONLY findings new to Phase 5 — it does not restate or merge Phase 1-4 findings, which remain tracked in their own reports.
**Repository State:** `tff-digital @ main`, `0ff429c8b1bdfc254c31de6860c972f6f7ee4e91` — unchanged throughout (confirmed §27, including no orphaned local server processes left running).

---

## 1. Executive Summary

Four prior phases established that this application is well-architected and, under normal operation, correct. Phase 5 asked a harder question — what happens at the edges — and, uniquely among the five phases so far, could answer it with genuine **empirical evidence**: real local production builds run against a deliberately broken WordPress endpoint, real browser console/network inspection, and live fault-injection-shaped requests against production itself, not just code reading.

**The headline finding is a real, live, reproducible bug:** a duplicated query parameter (something as ordinary as `?q=a&q=b`, producible by a browser extension, a malformed shared link, or a crawler) causes an **uncaught server-side 500 crash** on `/blog` and `/case-studies` today, because `searchParams` is typed as a plain string when Next.js actually delivers an array for repeated keys (**SMOKE-2, P1**). No secret leaks in the crash response, but it's a genuine unhandled exception on live, indexable, unauthenticated pages.

**The second most important discovery reframes how well this project's resilience architecture actually holds up.** The strict/soft split and ISR stale-serve pattern — already documented and trusted since the master audit — was **empirically proven this phase**, not just read as code: a real build was run against a live WordPress endpoint, then restarted with that endpoint broken, and a prebuilt case-study page kept serving correct content in ~5ms with zero WordPress calls, even past its 60-second revalidate window. That's genuinely good news. But the same test surfaced two real gaps at the architecture's edges that no prior phase could have found without doing this: on-demand renders of not-yet-statically-generated pages during an outage don't actually reach the app's own branded `error.tsx` (**OUTAGE-2, P2**) despite a code comment saying they should, and content **deleted** from WordPress during one of the already-known ~20-minute Bluehost outages would stay live and sitemap-listed for the full outage, not just 60 seconds (**CACHE-1, P2**).

**A third thread ties directly back to the project's oldest unresolved question.** The contact form's WordPress-save failures are **never logged server-side at all** — only email failures are (**MONITOR-1, P2**) — which plausibly explains part of why the historically-reported "lead created but no email" symptom has been so hard to pin down: if a lead-save itself ever fails, today, there would be zero trace of it anywhere.

**A fourth, more uncertain but potentially significant finding:** live browser testing of the contact page — the site's primary conversion mechanism — repeatedly found the form's entrance-fade animation could leave the section visibly dim and genuinely non-interactive on a cold page load with no scroll trigger, with clicks on the visible "Send a message" button misrouting to unrelated pages instead (**FORM-RT-2, P2**). The reporting fork was appropriately honest that real-world frequency is uncertain — most visitors scroll almost immediately, which incidentally resolves it — but the underlying mechanism is real and reproducible, and the potential downside (a silently inert primary CTA) is severe enough to warrant a real-device check.

**No regressions found** in anything re-checked this phase.

**Scorecard, new findings only:** 0 P0 · 1 P1 · 9 P2 · 3 P3 · 2 INFO — **15 new findings.**

---

## 2. Scope + Methodology

Six parallel research passes plus this orchestrating pass. Uniquely among the five phases so far, this one made heavy, deliberate use of **safe empirical testing** rather than relying primarily on code reading: local `next dev`/`next build && next start` sessions with environment variables overridden only at the process-invocation level (never written to any tracked file) to safely simulate WordPress outages without touching any real system; live browser automation (Claude in Chrome) for console/network inspection and safe client-side form-validation testing; and structured live requests against production for edge-case route/API behavior. No real contact-form lead or newsletter signup was submitted anywhere. No WordPress content was created, changed, or deleted. No source file, environment variable, or configuration was modified. Every local server process was confirmed cleanly killed before this report was written (§27). Every claim is either empirically verified (live or local), source-verified, or explicitly marked **NOT VERIFIABLE FROM THIS ENVIRONMENT**.

---

## 3. Existing Test Infrastructure

Unchanged from Phase 1's DEP-2: no test script in `package.json`, no Jest/Vitest/Playwright/Cypress configuration, no CI workflow. Nothing new to report — Phase 5's value is elsewhere.

---

## 4. Route Smoke Tests

#### SMOKE-1 — Malformed percent-encoded URLs cause a raw connection failure over HTTP/2 instead of a clean error response
- **Category:** Resilience / Protocol-layer. **Priority: P2.**
- **Exact location:** Vercel's edge network — occurs before any application code runs.
- **Evidence:** `curl "https://www.tffdigital.com/services/%ZZ"` over HTTP/2 (the default negotiated protocol, confirmed via `curl -w "%{http_version}"`) fails at the HTTP/2 framing layer with zero HTTP response — reproduced identically on `/case-studies/%ZZ`, `/blog/%ZZ`, and root-level. Forcing `--http1.1` on the identical URL returns a clean `400 Bad Request` every time. A separately-tested encoded-slash traversal attempt (`..%2F..%2Fadmin`) is correctly rejected with a clean `400` over HTTP/2 — so this is specifically an invalid-percent-encoding gap, not general edge fragility.
- **Reproduction:** `curl -v "https://www.tffdigital.com/services/%ZZ"` (fails) vs. `curl --http1.1` on the same URL (clean 400).
- **Production impact:** A malformed or bot-generated URL, over the protocol real browsers actually use, produces a raw connection failure with no branded error page at all — narrow trigger, not a normal user path.
- **Recommendation:** Flag to Vercel as a platform-behavior question; no application-side fix exists.
- **Claude Can Fix:** NO — platform layer, before any app code runs. **Manual/User Needed:** YES, Vercel support, low urgency.

#### SMOKE-2 — Duplicated query parameters cause uncaught server-side 500 crashes on multiple production routes
- **Category:** Resilience / Runtime crash. **Priority: P1.**
- **Exact location:** `src/app/blog/page.tsx:26,31,39-40`, `src/app/case-studies/page.tsx:21,25`; the identical vulnerable pattern also appears verbatim in `src/app/blog/tag/[slug]/page.tsx:23,40` and `src/app/blog/category/[slug]/page.tsx:23,40`.
- **Evidence:** Next.js delivers `string | string[] | undefined` for `searchParams` when a query key repeats, but every one of these files types it as a plain optional `string` with no runtime guard, then calls `.trim()` on it directly — a `TypeError` when the value is actually an array.
- **Reproduction (live, confirmed):** `GET /blog?q=a&q=b` → **500**. `GET /blog?after=x&after=y` → **500**. `GET /case-studies?after=x&after=y` → **500**. (`/blog/category/seo?after=x&after=y` returned 200 in this test — reason not fully diagnosed, an open question, not a contradiction of the core defect; `/blog/tag/[x]` was inconclusive since no real tags currently exist per Phase 4, so its not-found check fires first.)
- **What the response shows:** Next's own internal fallback shell (`__next_error__`), not the app's custom `error.tsx` — a bare RSC error digest with no message. `<meta name="robots" content="noindex">` is correctly present. **No stack trace, file path, or internal detail leaks** — confirmed by direct grep of the response body.
- **Open question, stated honestly:** whether the client-side `error.tsx` boundary ultimately renders its friendly fallback once a real browser hydrates this response is **NOT VERIFIABLE FROM THIS ENVIRONMENT** (a curl-based fetch can't execute client JS). What's confirmed is the initial server response: a genuine 500, correctly noindexed, no leak — but also no visible error UI in the raw HTML.
- **Production impact:** A real, reproducible, unauthenticated server crash on live, indexable production routes, triggerable by nothing more than an oddly-formed URL — the kind a browser extension, a buggy link-sharing tool, or a slightly malformed hand-edited URL could plausibly produce.
- **Recommendation:** Normalize `searchParams` values defensively in all 4 affected files (take the first value if an array, or explicitly redirect/400 rather than letting an unguarded-string assumption crash the render).
- **Claude Can Fix:** YES. **Manual/User Needed:** NO.

#### SMOKE-3 — Double-slash on a listing route takes 2 redirect hops instead of 1
- **Category:** Minor inefficiency (same class as the already-tracked apex-redirect finding, different trigger). **Priority: P3.**
- **Evidence:** `GET /case-studies//` → 308 → `/case-studies/` → 308 → `/case-studies` (200). A normal single trailing slash redirects in 1 hop.
- **Production impact:** Negligible — no real navigation path produces a double slash.
- **Claude Can Fix:** YES, if ever prioritized. **Manual/User Needed:** NO.

**Confirmed clean, not findings:** invalid percent-encoding, HTML/script-like slugs, and 500-character slugs all resolve to clean 404s over HTTP/1.1 with zero reflection anywhere in the response body. Missing-slug edge shapes all resolve sensibly. Repeated back-to-back fetches are stable. No raw stack trace or internal path found leaking in any edge case tested, including the SMOKE-2 crash itself.

---

## 5. WordPress Failure Matrix

Tested via a real `next build && next start` (production mode, not dev-mode artifacts) with `WORDPRESS_GRAPHQL_ENDPOINT` overridden at the process level only.

**Empirically confirmed working as designed, not new findings:** the strict/soft split behaves exactly as documented — the homepage returns 200 with the case-studies section cleanly degrading to empty, `#work` anchor still unconditionally present even under total CMS failure; sitemap generation returns 200 with just static routes, no crash. **Stale-ISR-survives-outage confirmed empirically, not just assumed**: a prebuilt case-study page kept serving full correct content at ~5-20ms with zero WordPress calls, both immediately and after the 60-second revalidate window had passed, content byte-identical both times.

#### OUTAGE-2 — Detail-page CMS-failure error boundary does not render the app's branded `error.tsx` for on-demand renders
- **Category:** Error Handling / Resilience. **Priority: P2.**
- **Exact location:** `src/app/case-studies/[slug]/page.tsx`, `src/app/blog/[slug]/page.tsx`, `src/app/services/[slug]/page.tsx`.
- **Evidence:** With WordPress unreachable and requesting a slug not part of the last successful static build (content published between deploys, or the first request after a bad build), all three routes return HTTP 500, but case-study/blog detail serve **Next's bare legacy `/_error` fallback** (plain unstyled text, none of the app's branding or "Try again"/"Back to home" actions), and service detail renders a confusing mixed state (generic fallback metadata alongside 404-boundary markup rather than the 500 boundary's own content). Reproduced consistently on retry. No stack trace or file path leaked — this is a UX/resilience gap, not an information-disclosure one. **Directly contradicts the code's own comment**, which states `getServiceOfferingBySlug` throwing "surfaces as the error boundary."
- **Reproduction:** `next build` (broken endpoint, zero pre-built detail slugs) → `next start` → `curl` a real case-study/service/blog slug.
- **Important caveat, stated honestly:** tested via `next start` (self-hosted Node), not actual Vercel serverless infrastructure — Vercel's runtime shares the same App Router error-boundary semantics but wasn't directly confirmed identical.
- **Production impact:** A visitor hitting a not-yet-statically-generated detail URL during any transient WordPress outage sees an unbranded, inconsistent error page instead of the site's own well-built fallback.
- **Recommendation:** Investigate why `error.tsx` isn't catching this specific on-demand-render failure path (likely related to how Next handles a thrown error during the SSG-fallback render versus normal dynamic SSR); worth a minimal reproduction against a real Vercel preview deploy before prioritizing a fix.
- **Claude Can Fix:** PARTIAL — diagnosing/fixing the wiring is real code work; confirming Vercel-specific parity needs a real deployment. **Manual/User Needed:** Helpful, not strictly required.

**OUTAGE-1 (INFO, not a finding needing action):** dev-mode-only, explicitly verified NOT present in a real production build — a full server stack trace and absolute local file paths appear in `next dev`'s RSC hydration payload on a caught WordPress error, but grepping the equivalent production-build response for the same strings returned zero matches. Recorded so a future session doesn't mistake dev-mode verbosity for a real leak.

---

## 6. Partial/Corrupted Content

**Live-confirmed using real, already-known content gaps, no fabrication:** `/services/ai-consulting`'s empty body description and both real case studies' null `relatedServices`/empty `results` field all render with a stable, clean layout in production — `ResultsGrid` and `RelatedServices` both explicitly `return null` on an empty array, by deliberate code comment. No broken/empty boxes, no crash.

#### PARTIAL-1 — GraphQL connection fields' `.nodes` accessed without full optional chaining in 5 locations across 4 adapters
- **Category:** Code Quality / Resilience (concretizes Phase 1's already-tracked CQ-1 with specific, reproducible locations). **Priority: P2.**
- **Exact location:** `src/adapters/case-study.adapter.ts:50`, `src/adapters/navigation.adapter.ts:10` and `:17` (inside the already-dormant ARCH-4 layer), `src/adapters/portfolio.adapter.ts:19` (inside the already-dormant ARCH-2 layer), `src/adapters/post.adapter.ts:30-31`.
- **Evidence:** In every instance, optional chaining guards the connection object (e.g. `relatedServices?`) but not the step to its `.nodes` property. If WordPress ever returned that field as a non-null object lacking `.nodes` — valid under GraphQL's type system, unexpected in practice, and distinct from the field simply being `null`, which every instance already handles safely — the expression throws `TypeError: Cannot read properties of undefined (reading 'map')` before any `??` fallback gets a chance to apply.
- **Reproduction/verification method:** Static code trace, confirmed character-by-character at each location; not empirically triggered (would require a malformed WordPress response, not safely producible without modifying WordPress or code — stated honestly rather than overstated).
- **Production impact:** Currently low-likelihood — WPGraphQL behaves consistently in normal operation, and the highest-traffic call site (`post.adapter.ts`, exercised by every real blog post view) hasn't shown this failure live. But it's a systemic pattern, not a one-off typo, in exactly the unvalidated-boundary layer Phase 1 already flagged — and the failure mode is the same class of uncaught-exception bug OUTAGE-2 documents, this time triggered by a malformed-but-live response rather than a full outage.
- **Recommendation:** Add `?.` between each connection field and `.nodes` at all 5-6 locations. Longer-term, this is another concrete argument for CQ-1's already-tracked Zod-at-the-boundary fix, which would catch this entire class of shape mismatch at the fetch boundary instead of adapter-by-adapter.
- **Claude Can Fix:** YES. **Manual/User Needed:** NO.

**Also checked, no finding:** no local `new Date()` parsing anywhere in the codebase — date fields pass through as raw strings, so no `Invalid Date` leak risk originates from application code (distinct from the already-tracked DATE-1 timezone-formatting issue).

---

## 7. Form Failure Matrix

**Directly answered, no action needed:** can the UI ever show a false success state? **No** — traced precisely: `success` is always literally `response.status === "success"`, sourced only from WordPress's own explicit response body; no code path can set it true otherwise. Empty submission and invalid-email states correctly isolate per-field errors with no console errors or duplicate-error glitches under rapid clicking.

#### FORM-RT-1 — Generic error messages misattribute cause for two real, distinct failure types
- **Category:** Error-handling UX. **Priority: P2.**
- **Exact location:** `src/features/contact/actions.ts`'s 3-bucket catch block; `src/features/contact/contact.schema.ts` (message field validation); `contact.service.ts:27` (`wpLeadResponseSchema.parse`).
- **Evidence:** The `message` field has `.min(10)` but **no `.max()`** client-side, while the WordPress plugin enforces a real 5000-character server-side cap — an oversized message gets a WordPress 400, which becomes a generic `kind:"http"` error, surfacing "couldn't reach our server just now" when the real problem is message length. Separately, an unexpected-shaped 2xx WordPress response would throw a `ZodError` inside `contact.service.ts`, landing in the same bucket as genuine client-input errors ("check the highlighted fields") — misleading, since by definition the input was already validated before this function runs. The plugin's response-construction code was read directly and confirmed well-designed against the second case (always returns a numeric `id`), making it low-probability — but the oversized-message case is concretely reachable by an ordinary user.
- **Reproduction:** Not safely live-testable without risking a real submission (correctly not attempted) — verified by full source trace, file:line cited above.
- **Production impact:** A user whose message is too long gets told to retry something that will fail identically every time, with no indication of the real cause.
- **Recommendation:** Add a `.max()` matching WordPress's real cap; discriminate the WordPress-response-shape `ZodError` case from the pre-validated-input case.
- **Claude Can Fix:** YES. **Manual/User Needed:** NO.

#### FORM-RT-2 — The contact form's entrance animation can leave the section stuck non-interactive on cold page load
- **Category:** Runtime/Resilience, primary-conversion-path. **Priority: P2.**
- **Exact location:** `src/sections/contact/ContactFormSection.tsx:37,42` — both the form and sidebar wrapped in `motion.div {...fadeInUp}`.
- **Evidence, live, reproduced multiple times:** navigating directly to `/contact` and waiting 5+ seconds with no scroll repeatedly left the section visually dim, well below its settled opacity, and effectively unclickable — three separate click attempts on the visible "Send a message" button during this state resulted in navigation to unrelated pages instead of any form interaction, consistent with the animated wrapper still gating pointer-events/its final transform. A single scroll-down-then-up nudge reliably and immediately resolved it every time. This is distinct from the already-tracked A11Y-5 (reduced-motion) finding — a load-time trigger race, not a motion-preference issue.
- **Reproduction:** Navigate to `/contact` with no subsequent scroll; observe opacity/clickability; compare against the same page after any scroll event.
- **Production impact, stated with honest uncertainty:** cannot fully quantify real-world frequency versus this being partly an artifact of the specific automation environment used to test it — most real visitors scroll almost immediately after landing, which would incidentally resolve it. But the underlying mechanism is real and plausible under real conditions too (a link opened in a background tab, switched to later, without an intervening scroll). Given this is the site's primary conversion mechanism, the downside if it does occur — a silently inert "Send a message" button — is severe even if frequency is uncertain.
- **Recommendation:** Trigger the animation on mount rather than pure viewport-intersection for above-the-fold content, or ensure the animated wrapper never sets pointer-events-blocking styles beyond a short, guaranteed-bounded window. Recommend a real-device check (not just automation) to gauge real-world frequency before prioritizing further.
- **Claude Can Fix:** YES for the fix. **Manual/User Needed:** Recommended for frequency validation, not strictly required for the fix itself.

---

## 8. Newsletter Failure Matrix

Live-confirmed: the Footer newsletter fires zero network request on submit (checked via live network capture), zero console errors, an instant fake-success swap — exactly matching the already-documented **UI STUB / NOT IMPLEMENTED** classification, no new glitch found. The blog `NewsletterSection` was not independently retested this phase — Phase 3/4 already established it's the identical stub pattern by its own code comment. No new findings.

---

## 9. Media/Image Failures

#### MEDIA-1 — Gravatar-sourced author avatar has no client-side error fallback, unlike the codebase's own established pattern for this exact problem class
- **Category:** Resilience / Media. **Priority: P2.**
- **Exact location:** `src/components/blog/AuthorCard.tsx:21-27`.
- **Evidence:** The `<Image>` for the author avatar has no `onError` handler. `author.avatar.url` resolves to `secure.gravatar.com` whenever a WordPress author has no custom avatar — already-established as the live state of the real blog post's "admin" author, so this path is live today, not hypothetical. By contrast, `SelectedWorkCard` (`SelectedWork.tsx:73-106`) solves the **identical** problem — a `next/image` sourced from a third-party host this app doesn't control — with a working `useState`+`onError` fallback to an icon. `AuthorCard.tsx` is a Server Component with no `"use client"` directive, so it structurally can't add `onError` without the same client-sub-component extraction `SelectedWorkCard` already required.
- **Reproduction:** Fetch `/blog/seo-for-small-businesses`, inspect the author card's `<img>` — no error-driven fallback exists if Gravatar is slow/unreachable/errors.
- **Production impact:** Low-probability but real — if it fires, the author card shows a broken-image icon instead of the `UserRound` fallback the component already has code for (which only triggers when the avatar field itself is null, not when a present URL fails to load).
- **Recommendation:** Extract a small client sub-component mirroring `SelectedWorkCard`'s pattern.
- **Claude Can Fix:** YES. **Manual/User Needed:** NO.

**Confirmed clean, not findings:** `next/image`'s optimizer, live-tested against an unreachable host and an allowed-host-but-nonexistent-file — both return fast, generic, non-leaking error responses (`400`/`404`), no hang or crash. The mshots website-preview image already has correct `onError` fallback handling — contrasts directly with MEDIA-1's gap. Alt-text sweep across all 17 files using `next/image` shows a 1:1 tag-to-alt ratio, no drift from Phase 1.

---

## 10. Third-Party Failure Behavior

#### RESEND-LOG-1 — Email failure logging doesn't identify which email or which lead failed
- **Category:** Observability / Third-party. **Priority: P3.**
- **Exact location:** `src/services/email.service.ts:17-27`.
- **Evidence:** `Promise.allSettled` logs each rejection via `console.error("[email.service] Failed to send lead email", result.reason)` — `result.reason` is a reasonably diagnostic typed `EmailError`, but the log line never states whether the *notification* or *confirmation* email failed, nor includes the lead's email/name to correlate a failure to a specific WordPress lead record.
- **Production impact:** Compounds the already-tracked FORM-1 (email delivery unverified) and Phase 4's LEAD-1 (potential total data loss in `'email'` storage mode) — diagnosing "which lead, which email" from logs requires cross-referencing timestamps rather than reading it directly.
- **Recommendation:** Pass a label (`"notification"`/`"confirmation"`) and `lead.email` into the log call.
- **Claude Can Fix:** YES. **Manual/User Needed:** NO.

**Confirmed clean, not findings:** Google Maps/YouTube are static iframes — a failed load is browser-native and contained, no JS-level handling needed. Fonts are self-hosted at build time via `next/font` — zero runtime third-party dependency, no failure mode exists. WordPress/WPGraphQL outage behavior is covered in §5, not duplicated here.

---

## 11. Preview/Draft Mode Edge Cases

**Malformed/edge-case IDs — fully verified via deterministic code trace:** `parsePreviewId()` requires `Number.isInteger(id) && id > 0`. Every tested case (non-numeric, negative, zero, SQL-injection-shaped string) is rejected cleanly before ever reaching a GraphQL variable — and even if it weren't, GraphQL variable binding isn't string-concatenated, so no injection surface exists regardless. One non-actionable observation: an extremely large numeric string can still pass `Number.isInteger()` due to float imprecision, but fails safely downstream (WordPress simply won't match any post, returning the existing clean 404) — not a vulnerability, not worth its own finding.

**Wrong post type (a case-study ID submitted to the service preview route, or vice versa) — could not be live-tested; no valid production secret exists in this environment** (`.env.local`'s preview secret remains empty/placeholder, consistent with every prior phase). Reasoned from source with high confidence instead of guessing: both preview queries use WPGraphQL's own type-scoped singular root fields, which only resolve posts of their own type — a mismatched ID would return `null`, already handled by the existing 404 path. **Explicitly marked NOT VERIFIABLE FROM THIS ENVIRONMENT** rather than asserted as confirmed.

Blog preview (`/api/preview/post`) reconfirmed 404 live, unchanged — remains the intentional, already-tracked gap, not re-flagged as new.

---

## 12. Cache/ISR Behavior

Empirically tested via a real production build against a genuinely broken WordPress endpoint (see §5's methodology). `sitemap.xml` is confirmed subject to the same ISR window as content pages (not previously stated explicitly) — it served the full, correct, pre-built URL list under simulated outage conditions.

#### CACHE-1 — Deleted/unpublished WordPress content can stay live, 200, and sitemap-listed for the full duration of a WordPress-unreachability window
- **Category:** Cache/ISR Resilience. **Priority: P2.**
- **Evidence:** The empirical test proves stale ISR content survives indefinitely through an outage — good resilience for a temporary blip, but with a real flip side: if a case study or service is **deleted** in WordPress, the static page (and its sitemap entry) keeps serving the old content until a revalidation actually *succeeds*. If that deletion coincides with, or is followed by, a WordPress-unreachability window, the stale page stays live past the nominal 60s for the entire outage. The master audit's already-documented INFRA-1 (Bluehost IP-ban, proven live, lasting ~20 minutes) is a real, recurring mechanism that could produce exactly this window.
- **Reproduction:** `next build && WORDPRESS_GRAPHQL_ENDPOINT=<unreachable> next start`, request a case-study page before and after the 60s revalidate window — both return 200 with identical content.
- **Production impact:** A deleted or unpublished case study/service could remain publicly reachable and sitemap-listed for up to ~20+ minutes in the worst case already known to recur on this host, not the nominal 60 seconds.
- **Recommendation:** Consider a shorter revalidate window for deletion-sensitive routes, or (larger lift) a WordPress webhook triggering on-demand revalidation on publish/unpublish/delete.
- **Claude Can Fix:** PARTIAL (revalidate-window tuning is code; a webhook solution is a larger feature). **Manual/User Needed:** NO for the code question.

---

## 13. Concurrency/Race-Condition Audit

No load testing performed (forbidden). Confirmed via code: neither the Server Action nor `lead.repository.ts` has any server-side idempotency mechanism — duplicate-lead risk depends entirely on the client-side button-disable (already tracked as Phase 4's FORM-4, not re-flagged here). Next.js's documented ISR request-coalescing applies here by default, no app-level override found that would disable it. Preview route handlers are fully stateless — no shared-state hazard exists for simultaneous requests. No new finding.

---

## 14. Error Boundaries

**Confirmed, not new:** `blog/[slug]/not-found.tsx` and `blog/category/[slug]/not-found.tsx` both exist but have zero metadata export — this precisely confirms the exact mechanism behind the already-tracked SEO-5 (generic inherited title instead of "Page not found") with more precision than prior phases established, not re-filed as new. The contact Server Action's try/catch is genuinely exhaustive — no error type can bubble past it.

#### SUSPENSE-1 — Zero `<Suspense>` boundaries anywhere in the codebase
- **Category:** Architecture/Resilience. **Priority: INFO.**
- **Evidence:** Repo-wide grep for `Suspense`, zero matches.
- **Impact:** No route has server-streaming granularity — a slow fetch blocks the whole route rather than showing partial content. Consistent with the already-established clean SSG/dynamic split, not obviously a problem at current scale.
- **Claude Can Fix:** YES, if streaming is ever wanted. **Manual/User Needed:** NO.

---

## 15. Hydration/Runtime Errors

**Clean, no findings.** Live browser console read on the homepage, a case-study detail page, a service detail page, and the blog post: zero console messages of any kind on all four — no hydration-mismatch warnings. Source audit: zero `Date.now()`/`Math.random()` usage anywhere in `src/`; one `document.` grep hit investigated and ruled out (a local variable named `document` holding a GraphQL string, not the DOM API). No genuine non-deterministic-render or browser-API-on-server risk pattern found.

**Separately, live console/network read on the same 4 pages plus `/contact` and `/blog`'s search feature: zero uncaught exceptions, zero unhandled rejections, zero React warnings found anywhere.** A genuinely positive, empirically-confirmed result, not just an absence of investigation.

#### RSC-1 — Intermittent 503 on Next.js's automatic background link-prefetch
- **Category:** Runtime/Reliability. **Priority: P2** (real live signal; low actual user-facing impact — see below).
- **Evidence:** Live browser network monitoring caught `GET /about?_rsc=...` and `GET /services?_rsc=...` (Next's own automatic prefetch, fired when a `<Link>` scrolls into view) returning 503 on two independent occasions. **Reproduction attempted and inconclusive**: 16 separate direct `curl` requests reproducing the exact request shape (sequential and concurrent) all returned 200; direct normal page loads of both routes are also consistently fast and clean.
- **Impact if real:** Low for end users — a failed background prefetch just means Next falls back to a normal full navigation on click, not a broken page.
- **Recommendation:** Not urgent — nothing to fix in application code. Worth a look at Vercel's function/edge logs around this session's timestamps (2026-09-02, ~05:15-05:23 UTC), given the unusually high concurrent request volume this multi-phase audit has itself generated against production today.
- **Claude Can Fix:** NO. **Manual/User Needed:** YES — Vercel dashboard/log review, if worth chasing further.

---

## 16. API Robustness

**Clean, mostly extends already-known behavior:** `PUT`/`DELETE`/`PATCH` all correctly 405 on all 3 preview routes (extends the already-tracked POST→405 finding to the fuller method set). Malformed/unusual `Accept`/`Content-Type` headers have zero effect on routing. 405 bodies are completely empty — zero leak. Full CSP/security-header set applied even to error responses — good defense-in-depth, confirmed at a new level of specificity.

#### API-RT-1 — 405 responses omit the `Allow` header
- **Category:** HTTP Spec Compliance. **Priority: P3.**
- **Evidence:** A `DELETE` to a preview route returns 405 with the full CSP/security header set but no `Allow:` header (RFC 7231 §6.5.5 recommends one).
- **Impact:** Cosmetic/spec-compliance only.
- **Claude Can Fix:** YES. **Manual/User Needed:** NO.

---

## 17. SEO Under Failure

**Empirically confirmed safe, not just reasoned.** A genuine server error (WordPress unreachable, `/services/[slug]` with no ISR fallback) returns a real HTTP 500, not a silently-200'd error page — confirmed via the same local production test as §5/§12. That 500 response carries `<meta name="robots" content="noindex">`, automatically injected by Next's error-boundary rendering. Grepped the 500 response body for error message, stack trace, and file paths in the production build — zero matches (a parallel dev-mode test did show these, standard well-documented dev-only behavior, never present in what deploys to Vercel — noted for completeness, not filed as a finding, per §5's OUTAGE-1).

**Category: INFO / Working as designed, empirically confirmed rather than assumed** — no finding filed, but recorded because this is a question no prior phase had actually tested.

---

## 18. Build/Deployment Reproducibility

Grepped `src/` for absolute/local-only paths (`/Users/`, `~/`) — zero matches. `package-lock.json` uses standard `lockfileVersion: 3`, no manual-edit smell. No build-time code found reading an env var without a fallback in a way that would crash the build itself. No "works on my machine" risk found. No new finding.

---

## 19. Monitoring/Observability

Confirmed: no error-tracking SDK anywhere (Sentry/LogRocket/Datadog/Bugsnag/Rollbar all absent), no request-ID/correlation-ID generation anywhere in the request-handling code.

#### MONITOR-1 — Contact-form WordPress-submission failures are never logged server-side at all
- **Category:** Observability. **Priority: P2.**
- **Exact location:** `src/features/contact/actions.ts:18-47`.
- **Evidence:** The function has three catch branches. `ZodError` (expected, no logging needed): none. **The `isWordPressError` branch — covering every WordPress REST failure kind (config, network, timeout, http, parse, graphql) — has zero `console.error` call anywhere.** Only the final generic catch-all actually logs. By contrast, `email.service.ts` does log email failures clearly (with the gap noted in §10's RESEND-LOG-1).
- **Reproduction:** Direct read of `actions.ts:18-47`, confirmed no logging statement exists on the WordPress-error path.
- **Production impact:** If the contact form's WordPress-save step fails for any reason — the exact category most relevant to the project's oldest open question, FORM-1's "lead created but no email" symptom — it leaves **zero trace in server logs.** This plausibly explains part of why that historically-reported symptom has been hard to diagnose after the fact.
- **Recommendation:** Add a `console.error` (with the `error.kind` discriminant and enough context to distinguish it from an email failure) inside the `isWordPressError` branch before returning the user-facing message.
- **Claude Can Fix:** YES. **Manual/User Needed:** NO.

---

## 20. Recovery/Business Continuity

Synthesis, grounded in this phase's own empirical findings above, not new investigation:

- **~1 minute WordPress outage:** negligible impact — everything within its ISR window keeps serving normally.
- **~10 minutes:** static/ISR pages (home, about, case studies, blog post, legal pages) continue serving correctly per §5/§12's empirical confirmation; `/services/[slug]` (no ISR) and `/case-studies` listing (fully dynamic) begin failing with a correctly-handled 500/noindex per §17; the contact form's WordPress-save step fails silently in logs per MONITOR-1, though the user still sees a correct generic error message.
- **~1 hour (longer than any currently-documented Bluehost ban):** same as 10 minutes, sustained — no new failure mode emerges, but CACHE-1's deletion-during-outage risk window is proportionally larger the longer the outage runs.

This matches what a reasonable reading of prior phases would already predict — this phase's contribution is replacing "reasoned from docs" with "empirically confirmed" for the core stale-serve claim, and surfacing the two real edge gaps (OUTAGE-2, CACHE-1) that empirical testing — not code reading alone — was able to find.

---

## 21. Findings Table

Phase 5 new findings only.

| ID | Category | Priority | Finding | Claude Fix? | Manual/User? |
|---|---|---|---|---|---|
| SMOKE-2 | Resilience | P1 | Duplicated query params crash `/blog`, `/case-studies` with an uncaught 500 | YES | NO |
| SMOKE-1 | Protocol | P2 | Malformed percent-encoding drops the connection over HTTP/2 | NO | YES (Vercel) |
| OUTAGE-2 | Error Handling | P2 | Branded `error.tsx` doesn't catch on-demand-render CMS failures | PARTIAL | Helpful |
| PARTIAL-1 | Code Quality | P2 | `.nodes` accessed without full optional chaining in 5 spots | YES | NO |
| FORM-RT-1 | Error UX | P2 | Generic error messages misattribute oversized-message/schema failures | YES | NO |
| FORM-RT-2 | Runtime/UX | P2 | Contact form can be stuck non-interactive on cold load, no scroll | YES | Recommended |
| MEDIA-1 | Resilience | P2 | Gravatar avatar has no error fallback (pattern exists elsewhere) | YES | NO |
| RSC-1 | Reliability | P2 | Intermittent 503 on background prefetch, inconclusive reproduction | NO | YES (Vercel logs) |
| CACHE-1 | Cache/ISR | P2 | Deleted content can stay live for a full outage window, not 60s | PARTIAL | NO |
| MONITOR-1 | Observability | P2 | WordPress-save failures in the lead pipeline are never logged | YES | NO |
| SMOKE-3 | Minor | P3 | Double-slash takes 2 redirect hops instead of 1 | YES | NO |
| RESEND-LOG-1 | Observability | P3 | Email failure logs don't identify which email/lead failed | YES | NO |
| API-RT-1 | Spec Compliance | P3 | 405 responses omit the `Allow` header | YES | NO |
| OUTAGE-1 | Info Disclosure | INFO | Dev-mode-only stack trace, confirmed NOT in production | N/A | NO |
| SUSPENSE-1 | Architecture | INFO | Zero Suspense boundaries anywhere | YES if wanted | NO |

**15 new findings: 0 P0 · 1 P1 · 9 P2 · 3 P3 · 2 INFO.**

---

## 22. Claude-Fixable Findings

**P1:** SMOKE-2. **P2:** PARTIAL-1, FORM-RT-1, FORM-RT-2, MEDIA-1, MONITOR-1, CACHE-1 (partial — revalidate tuning). **P3:** SMOKE-3, RESEND-LOG-1, API-RT-1. **INFO:** SUSPENSE-1, if streaming is ever wanted.

---

## 23. Manual/User-Required Findings

SMOKE-1 (Vercel platform question, low urgency), RSC-1 (Vercel function/log review), OUTAGE-2 (a real Vercel preview deploy would strengthen the diagnosis, not strictly required), FORM-RT-2 (a real-device frequency check is recommended before further prioritization).

---

## 24. Business Decisions

None new this phase — CACHE-1's webhook-based-revalidation option is a larger architectural choice worth a decision if the deletion-during-outage window is judged worth closing beyond the smaller revalidate-window mitigation, but this is a technical tradeoff more than a business one.

---

## 25. Unknown / Not Verifiable

- Whether the client-side `error.tsx` fallback actually renders once a real browser hydrates SMOKE-2's 500 response — a curl-based fetch can't execute client JS to confirm this.
- Whether OUTAGE-2's behavior is identical on real Vercel serverless infrastructure versus the local `next start` this was tested against.
- RSC-1's root cause — genuinely reproduced live twice, but not reproducible via 16 direct `curl` attempts; may be a real, rare Vercel-edge condition or an artifact of this session's own unusually high request volume against production today.
- The wrong-post-type preview test (§11) — no valid production preview secret exists in this environment to test with.
- FORM-RT-2's real-world frequency for genuine visitors versus this specific automation environment.

---

## 26. Already-Correct Behavior

Empirically confirmed, not just assumed, this phase: the strict/soft resilience split; ISR stale-content survival through a genuine simulated outage, including past the revalidate window; sitemap generation surviving a WordPress outage cleanly; a genuine server error correctly returning HTTP 500 with noindex, never a falsely-indexable 200; zero hydration mismatches and zero JS console errors across every page type tested; the contact form's client-side validation (empty submission, invalid email) behaving correctly with no false-success-state possible, verified by direct code trace; the Footer newsletter's stub behavior confirmed glitch-free; preview-route malformed-ID rejection fully sound; dev-mode-only error verbosity confirmed absent from what actually ships to production.

---

## 27. Recommended Phase 6 Audit

Five phases have now covered architecture, dependencies, code quality, SEO, security, performance, accessibility, UI, WordPress content, functionality, and — this phase — resilience and edge-case behavior, with real empirical testing wherever safely possible. What remains is what Phase 4 already recommended and this phase reinforces from a different angle: **human-in-the-loop verification of the small set of things no read-only automated pass can safely close out** — one real contact-form test submission to finally resolve FORM-1/LEAD-1/MONITOR-1 together (does the lead save, does logging now show a failure if one occurs, does email actually arrive); a real Vercel preview-deploy check of OUTAGE-2 and RSC-1 against actual serverless infrastructure rather than a local approximation; and a real mobile-device pass to settle both the long-standing viewport-tool limitation and FORM-RT-2's real-world frequency question. A focused "Phase 6: live verification and Vercel-infrastructure parity check" would close out nearly everything this and Phase 4 have left open.

---

## FINAL STATUS

Git status confirmed immediately before writing this report and re-confirmed after:

1. `git status`: 11 pre-existing unstaged `docs/*.md` deletions (unchanged since Phase 3, disclosed there and in Phase 4, not touched this phase) + this session's `PHASE_1` through `PHASE_4` reports + `docs/TFF_DIGITAL_MASTER_AUDIT.md`, all untracked, none created or modified by Phase 5 except this new report.
2. **No source files modified.**
3. **No configuration modified.**
4. **No WordPress content modified.**
5. **No deployment triggered.**
6. **15 new findings.**
7. **0 P0 · 1 P1 · 9 P2 · 3 P3 · 2 INFO.**
8. **Exact UNKNOWN items:** whether `error.tsx` renders client-side after SMOKE-2's crash; OUTAGE-2's exact behavior on real Vercel infrastructure; RSC-1's root cause; the wrong-post-type preview test (no valid secret available); FORM-RT-2's real-world frequency.
9. **Recommended next phase:** live human-in-the-loop verification and Vercel-infrastructure parity checks (Phase 6), per §27.

**PHASE 5 AUDIT COMPLETE**
**READ-ONLY**
**NO FIXES APPLIED**
**NO COMMIT**
**NO PUSH**
