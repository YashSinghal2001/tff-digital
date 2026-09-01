# Final QA Audit — 20 August 2026

Full end-to-end audit of tffdigital.com (Next.js 15 + headless WordPress): every route, responsive widths 320px → desktop, SEO, links, forms, accessibility, and the CMS integration — with every safe fix applied, browser-verified, built for production, and pushed to `main`.

**Score:** 17 issues found · 13 fixed & verified · 4 need action outside the repo · 0 console errors, 0 overflow, 0 type errors.

---

## ⚠️ The one thing to know

The WordPress server (`cms.tffdigital.com`) was **completely down** for several hours during this audit — refusing connections worldwide (verified via third-party relays), not just locally. Consequences observed live:

- A Vercel deploy during the outage shipped a blog with **zero posts** and a sitemap missing every dynamic URL.
- The site logo + photos (hotlinked from the CMS) **502'd for visitors**.

The CMS came back mid-audit. The images are now self-hosted so the brand can't disappear again, and the push to `main` triggers a fresh deploy that re-bakes the blog and sitemap. **Ask your hosting provider why the server went down** — until then, any deploy during an outage will bake empty content again.

---

## A. Project health

**Verdict: release-candidate quality.** The codebase is genuinely well-engineered — clean typed architecture (services → repositories → GraphQL → adapters with mock fallbacks), hardened CSP and security headers, zero TypeScript/ESLint errors, zero horizontal overflow at any width from 320px up, one H1 and unique metadata per route, and a carefully built carousel/a11y layer.

The issues found were concentrated in: assets hotlinked to the CMS, a handful of dead/404 links, placeholder UI that shipped ("Map placeholder", an empty culture panel), SEO fallback gaps, and WordPress content that is still test data.

## B. Pages audited

Every route loaded and inspected in the browser (desktop 1440px) and measured at 320 / 375 / 768 / 1024px; metadata audited over HTTP for all of them — in dev, in mock mode, and against the final production build:

`/` · `/about` · `/services` · `/services/seo` · `/services/smm` · `/services/[slug]` · `/blog` · `/blog/[slug]` (incl. the real post `seo-for-small-businesses`) · `/blog/category/[slug]` · `/blog/tag/[slug]` · `/case-studies` · `/case-studies/[slug]` · `/contact` · `/privacy-policy` · `/terms-and-conditions` · 404 page · `robots.txt` · `sitemap.xml` · `manifest`

## C / D. Issues found → fixed

| # | Severity | Issue | Status |
|---|----------|-------|--------|
| 1 | 🔴 Critical | CMS server down globally — live site degraded (empty blog, gutted sitemap, 502'd images) | ⏳ Host action — server recovered; root cause unknown |
| 2 | 🔴 Critical | Logo + founder/FAQ photos hotlinked to the CMS — a WP outage deleted the brand from every page | 🟢 Fixed — originals recovered (logo from Vercel edge cache mid-outage), optimized 10.8 MB → ~450 KB, self-hosted in `/public`, all six references updated |
| 3 | 🟠 High | Two 404 links on the homepage — "Learn more" on Meta Ads and Video Editing pointed to `/services/google-meta-ads` and `/services/video-editing` (slugs don't exist in WP; verified live) | 🟢 Fixed — cards without a live detail page no longer render a link |
| 4 | 🟠 High | `/services` grid rendered WordPress test data ("AI Consulting Updated", "Web Development 2", "AI Automation Updated"…) whenever the CMS was up | 🟢 Fixed — grid now shares the homepage's curated disciplines (`src/data/temporary-services.ts`) with the same `TODO: RESTORE WORDPRESS DATA` markers |
| 5 | 🟠 High | Three dead `href="#"` social buttons on the contact page with wrong generic icons | 🟢 Fixed — real LinkedIn/Instagram/X/Facebook links with proper brand icons, shared with the footer via one module |
| 6 | 🟠 High | "TFF Digital \| TFF Digital" page titles on items without Yoast SEO data (live on both case-study pages) | 🟢 Fixed — `buildMetadata` now takes a content-derived fallback (item title + cleaned summary) |
| 7 | 🟡 Medium | Literal "Map placeholder" card shipped on the contact page | 🟢 Fixed — lazy-loaded keyless Google Maps embed of Zirakpur, accessible title, CSP frame-src extended |
| 8 | 🟡 Medium | Empty placeholder panel in About → Our Culture | 🟢 Fixed — 3×2 mosaic of the six existing team portraits on the team-card navy stage |
| 9 | 🟡 Medium | Featured image could render twice on blog posts (`-scaled` variants, linked images, leading comments not handled) | 🟢 Fixed — all three gaps closed; 10 fixtures pass incl. the live post's exact markup |
| 10 | 🟡 Medium | Sitemap advertised `/case-studies/test` (throwaway WP entry) while hiding the two live fallback case studies; would also list WP test services | 🟢 Fixed — sitemap uses the same filtered source as the pages; `/case-studies/test` now 404s |
| 11 | 🟡 Medium | No Open Graph image sitewide — shares rendered with no card image | 🟢 Fixed — branded 1200×630 card generated and wired as default; Yoast OG images override per page |
| 12 | 🔵 Low | 404 page had the bare default title | 🟢 Fixed — "Page not found \| TFF Digital" + noindex |
| 13 | 🔵 Low | Oversized photo sources (2500px, 1.7–4.7 MB each) | 🟢 Fixed — downscaled to 1200px, recompressed |
| 14 | 🔵 Low | Stale `audit.md` in the repo | 🟢 Fixed — deletion committed separately |

## E. SEO

- 🟢 Verified: unique `<title>`, meta description, canonical, exactly one H1 on every route; correct heading order.
- 🟢 Verified: Organization + WebSite JSON-LD sitewide; BlogPosting / CreativeWork / Breadcrumb JSON-LD on the right pages; Yoast data flows correctly on the real post.
- 🟢 Fixed: sitemap now = 10 static routes + real blog posts + the two live case studies (13 URLs), nothing fake, nothing missing.
- 🔴 **Your action:** Vercel domain direction is inverted — `tffdigital.com` 301s to `www`, but every canonical/JSON-LD/sitemap URL points to the apex. Fix in Vercel → Settings → Domains (apex primary, www redirects). Do NOT add a code-level redirect — it would loop against Vercel's edge. Then request re-indexing in Google Search Console. The stale Google snippet ("Go from idea to live site…") comes from a previous site on this domain — it exists nowhere in this codebase or its git history.
- 🟠 **Your action:** `cms.tffdigital.com` is fully crawlable (robots.txt allows everything + exposes a Yoast sitemap) → Google can index duplicate content. Fix in WP: Settings → Reading → Discourage search engines, or an X-Robots-Tag.

## F. Responsive

🟢 Zero horizontal overflow on **every route** at 320, 375, 768, and 1024px (measured in-browser), plus visual passes at 375 and 1440px. Mobile nav opens/closes with body-scroll lock; team carousel collapses to one card with working dots/arrows, no clipping; all grids reflow correctly; footer stacks cleanly. No fixes needed — this layer was already solid.

## G / H. UI/UX & accessibility

- 🟢 Already in place and working: skip-to-content link, aria-labels on icon buttons, carousel keyboard arrows + inert off-screen slides, focus-visible rings, form labels + `role="alert"` errors, reduced-motion handling.
- 🟢 Fixed: dead-looking controls removed (socials now link; unlinkable service cards no longer pretend); map embed has an accessible title; mosaic images reuse descriptive alt text.
- 🟢 Verified: anchor navigation from other pages (`/#process`, `/#work`, `/#testimonials`) lands correctly below the fixed header; back/forward and direct URL loads behave.

## I. Performance

- 🟢 Production build: 19 routes, shared JS 155 kB, heaviest page 285 kB first-load. Fonts self-hosted via next/font; lucide/framer-motion imports optimized; below-fold images lazy; LCP hero has priority.
- 🟢 Logo no longer round-trips through the slow WP host (config notes 5–7s per image there); founder/FAQ photo payloads cut ~24×.

## J. CMS / WordPress integration

| Content type | In WordPress today | What production serves |
|---|---|---|
| Services | 7 test entries ("AI Consulting Updated", "Web Development 2"…) | Curated 5-discipline grid from the repo (temporary, marked for restore) |
| Case studies | 1 throwaway "test" entry | The two repo fallback case studies; "test" hidden + 404 |
| Blog posts | 1 real post (**no featured image set**) | The real post, correctly rendered with Yoast SEO |
| Leads (contact form) | REST endpoint + plugin | Working pipeline: validation → WP save → Resend emails, graceful errors when WP is down |

Error handling, loading and empty states all exist and behave; mock-data mode works. The integration code is ready — **the content isn't**. When real WP content exists, grep `TODO: RESTORE WORDPRESS DATA` and follow the commented restore paths.

## K. Security / configuration

- 🟢 No secrets in source; Resend key server-only; strict CSP, nosniff, frame-ancestors, referrer + permissions policies present. The two `dangerouslySetInnerHTML` uses are JSON-LD and your own CMS's article HTML, constrained by CSP.
- 🟢 No .htaccess files touched anywhere.
- 🔵 Note: local `.env.local` has `EMAIL_FROM="PASTE_YOUR_VERIFIED_SENDER_EMAIL_HERE"` — local-dev emails fail until filled (production values live in Vercel).

## L / M / N. Browser testing · console · links

- Manually navigated every page at 1440px + mobile passes; tested nav, mobile menu, carousels (auto-play, arrows, dots, swipe), FAQ accordions, contact form states, anchor links, refresh and direct loads — on dev and the production build.
- **Console:** 0 errors before and after (only failures ever seen were CMS-image 502s during the outage — resolved by self-hosting).
- **Broken links:** before — 5 (2× homepage 404 links, 3× "#" socials); after — 0. External links verified except the Upwork profile (bot-blocks automated checks — worth one manual click).

## O. Remaining items (need you, not the repo)

1. 🔴 **Ask your host why cms.tffdigital.com went down.** Multi-hour global outage on 2026-08-20. The frontend now survives it, but blog/case-study/lead pipelines still depend on that server.
2. 🟠 **Flip the Vercel domain direction (apex primary), then request re-indexing in GSC.** This is the main fix for Google showing stale/incorrect results.
3. 🟠 **Author real WordPress content.** Real services + case studies (then follow the `RESTORE WORDPRESS DATA` markers); delete test entries; re-set the blog post's featured image (safe now — double-render bug fixed); change author display name from "admin"; add alt text to content images; noindex the cms subdomain.
4. 🟡 **Decide the newsletter backend.** Both subscribe forms (footer + blog) are documented UI-only stubs that show success without saving the email. The WP leads endpoint can't take them (requires name/budget/message). Options: a Resend Audience, a small WP endpoint, or removing the forms until one exists.

**Also flagged (deliberately not changed):** the displayed contact email is `info@tffdigita.com` (no "l"), exactly as specified — but the lead-notification config uses `info@tffdigital.com` and the site domain is tffdigital.com. If "tffdigita" is a typo, it's a one-line find/replace in four files: `ContactFormSection.tsx`, `Footer.tsx`, `PrivacyPolicyBody.tsx`, `TermsBody.tsx`.

## P. Files changed

- **New assets:** `public/logo.png` · `public/founders/raju.jpg` · `public/founders/kanchan.jpg` · `public/faq-team.jpg` · `public/og-image.png`
- **New modules:** `src/data/temporary-services.ts` · `src/components/icons/social-icons.tsx`
- **SEO:** `lib/seo/metadata.ts` · `lib/seo/sitemap.ts` · `config/seo.config.ts` · `app/layout.tsx` · `app/not-found.tsx` · the three `[slug]/page.tsx` files
- **Sections/UI:** `WhatWeDo` · `ServicesGrid` + services page · `ContactFormSection` · `OurCulture` · `AboutJourney` · `HeroShowcase` · `FAQ` · `Footer` · `Logo`
- **Content pipeline:** `lib/content/post-content.ts` (dedup hardening) · `lib/fallback/case-studies.fallback.ts`
- **Config:** `next.config.ts` (CSP frame-src + Google Maps)

## Q. Git status

Two commits pushed to `origin/main` (no force-push, no branch changes, working tree clean):

- `01de8c7` — chore: remove outdated architecture audit doc
- `1f37f50` — fix: production QA pass — self-hosted assets, dead links, SEO fallbacks (28 files, +359/−169)

The push triggers a fresh Vercel deploy, which — now that the CMS is back — also repairs the outage-era build: the blog listing repopulates and the sitemap regains its dynamic URLs.

---

*Audited and fixed by Claude Code · verified against the dev server, mock mode, the live production site, and a local production build · 20 August 2026*
