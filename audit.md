# Architecture Audit — Next.js → Headless WordPress Migration Readiness

A full-repository audit of routes, components, hardcoded content, SEO, and performance — mapped against the WordPress content model (Services, Projects, Team, Testimonials, FAQs live; Blog, Categories, Tags planned) to produce an exact migration order.

| | |
|---|---|
| Framework | Next.js 15.5.22 |
| Router | App Router |
| Runtime | React 19.1.0 |
| Files audited | 198 `.ts`/`.tsx` |
| Data mode | Mock (WordPress not connected) |
| Audit date | 2026-08-06 |

> **Headline finding.** This codebase is not a typical static site with hardcoded arrays waiting to be discovered — it already has a genuine headless-CMS data layer (`services → repositories → GraphQL/REST → adapters`, with a mock-data fallback) built for **Blog, Categories/Tags, Services, Portfolio, Case Studies, generic Pages, and Navigation menus**. The blog vertical is essentially production-ready. The gap is concentrated in three places: (1) marketing sections still importing local arrays instead of calling the services that already exist for them, (2) two content types — **Portfolio and Case Studies** — have a complete backend but zero UI route, and (3) three content types your WordPress instance has configured — **Team, Testimonials, FAQ** — have *no* code-side plumbing at all yet.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Route Audit](#2-route-audit)
3. [Component Audit](#3-component-audit)
4. [Static Content Audit](#4-static-content-audit)
5. [WordPress Migration Map](#5-wordpress-migration-map)
6. [Missing Features](#6-missing-features)
7. [SEO Audit](#7-seo-audit)
8. [Performance Audit](#8-performance-audit)
9. [WordPress Readiness Score](#9-wordpress-readiness-score)
10. [Missing CMS Features](#10-missing-cms-features)
11. [Suggested Folder Structure](#11-suggested-folder-structure)
12. [Final Migration Plan](#12-final-migration-plan)

---

## 1. Project Overview

### Framework & router

Next.js **15.5.22** on React **19.1.0** / react-dom 19.1.0, using the **App Router** exclusively (`src/app`) — no `pages/` directory exists. Both `dev` and, notably, `build` run under **Turbopack** (`next build --turbopack` in `package.json`), which is still marked beta for production builds upstream — worth pinning/monitoring as a stability risk before a real launch.

### TypeScript

`strict: true`, path alias `@/*` → `src/*`, target ES2017, module resolution `bundler`. Clean, standard, no relaxations found.

### Tailwind CSS

**Tailwind v4**, CSS-first configuration — there is no `tailwind.config.js`. Theme is declared via `@theme inline` in `src/app/globals.css`, mapped to CSS custom properties defined in `src/styles/tokens.css`. `@tailwindcss/postcss` handles the build; `prettier-plugin-tailwindcss` keeps class order sorted.

### Folder structure

A layered, service-oriented architecture — closer to a production headless-CMS frontend than a typical marketing site:

- `app/` — routes only, thin: imports sections, sets metadata, calls services.
- `sections/` — page-section components, one per visual block, grouped by page (`home/`, `about/`, `seo/`, `smm/`, `services/`, `blog/`, `contact/`, `shared/`).
- `components/{ui,common,layout,blog}` — presentational primitives, mostly prop-driven and already reusable.
- `features/` — client-side feature slices with their own server actions (currently just `contact/`).
- `services/` → `repositories/` → `adapters/` — the data layer: services decide mock-vs-live, repositories call GraphQL/REST, adapters map WordPress wire shapes to domain types.
- `graphql/{queries,fragments}` — hand-written WPGraphQL documents, already targeting real WPGraphQL type names (`Service`, `PortfolioItem`, `CaseStudy`, `Post`).
- `types/{api,domain,ui}` — three-tier typing: raw WP wire types, clean domain types, UI prop types. Not conflated anywhere audited.
- `lib/{wordpress,seo,content,mock,utils}`, `schemas/` (Zod), `config/`, `constants/`, `styles/`.

This structure is **already the target end-state** for a headless WordPress app (see §11) — the migration work is mostly filling gaps in an existing shape, not building the shape.

### State management

No global state library (no Redux/Zustand/Jotai/React Context store). `src/providers/` exists but is empty (`.gitkeep` only). All state is local `useState` — Navbar mobile menu, Footer newsletter input, FAQ accordion open-index, ContactForm submit/error state. This is correct for a mostly-static, mostly-server-rendered site; no change needed for the CMS migration.

### Animation

**Framer Motion 12.43.0**, used almost everywhere via two shared variants in `src/styles/animations.ts` (`fadeInUp`, `fadeIn`). Correctly scroll-triggered (`whileInView`, `viewport.once`) rather than mount-triggered, avoiding wasted work on long pages. `lucide-react` and `framer-motion` are both listed under `experimental.optimizePackageImports` in `next.config.ts` for tree-shaking.

### Forms

**react-hook-form 7.84.0** + **@hookform/resolvers 5.7.1** + **zod 4.4.3**. Two forms exist: the Contact form (fully wired to a server action → WordPress REST leads endpoint) and Blog Search (query-param driven). Newsletter signup is a bare uncontrolled `<form>` with no validation library and no backend (see §6).

### SEO setup

Genuinely two-tier: a real SEO toolkit exists (`src/lib/seo/{metadata,json-ld,canonical,sitemap,robots}.ts`) that maps a WordPress-shaped `Seo` domain object into Next's `Metadata` API plus JSON-LD builders — but it is **only wired into the blog vertical and the root layout**. Every marketing page (Home, About, Services, SEO, SMM, Contact) hand-writes a static `metadata` export and emits no structured data at all. Full detail in §7.

---

## 2. Route Audit

Every route that exists under `src/app`, plus every route referenced in `src/constants/routes.ts` that has no matching page file.

| Route | File | Type | Status |
|---|---|---|---|
| `/` | `app/page.tsx` | Static | ✅ Live |
| `/about` | `app/about/page.tsx` | Static | ✅ Live |
| `/services` | `app/services/page.tsx` | Static | ✅ Live |
| `/services/seo` | `app/services/seo/page.tsx` | Static, one-off | ⚠️ Partial — hand-built, not part of a `[slug]` route |
| `/services/smm` | `app/services/smm/page.tsx` | Static, one-off | ⚠️ Partial — same issue |
| `/contact` | `app/contact/page.tsx` | Static | ✅ Live |
| `/blog` | `app/blog/page.tsx` | Dynamic, server, searchParams | ✅ Live |
| `/blog/[slug]` | `app/blog/[slug]/page.tsx` | Dynamic (+ loading, not-found) | ✅ Live |
| `/blog/category/[slug]` | `app/blog/category/[slug]/page.tsx` | Dynamic (+ loading, not-found) | ✅ Live |
| `/blog/tag/[slug]` | `app/blog/tag/[slug]/page.tsx` | Dynamic (+ loading, not-found) | ✅ Live |
| `/sitemap.xml` | `app/sitemap.ts` | Generated | ✅ Live — only lists routes that exist (see §7) |
| `/robots.txt` | `app/robots.ts` | Generated | ✅ Live |
| 404 | `app/not-found.tsx` | Static | ✅ Live |
| Error boundary | `app/error.tsx`, `app/global-error.tsx` | Static | ✅ Live |
| Root loading | `app/loading.tsx` | Static | ✅ Live |

### Missing routes

Declared in `src/constants/routes.ts` and have a complete backing service, but no page:

| Route | Backed by | Gap |
|---|---|---|
| `/portfolio` | `portfolio.service.ts` | ❌ Missing — no `app/portfolio/` at all |
| `/portfolio/[slug]` | `portfolio.service.ts` | ❌ Missing |
| `/case-studies` | `case-study.service.ts` | ❌ Missing — no `app/case-studies/` at all |
| `/case-studies/[slug]` | `case-study.service.ts` | ❌ Missing |
| `/services/[slug]` | `service-offering.service.ts` | ❌ Missing — only 2 of 9 listed disciplines have a page (see §4); the other 7 link back to the generic `/services` hub |

> **This gap is self-documented in the code.** A comment in `src/lib/seo/sitemap.ts:11-15` explicitly says: *"Only routes that resolve to an actual page today. Portfolio, Case Studies, and per-slug Service pages have a full repository/service/mock layer already built … but no route under src/app yet — listing them here would put 404s in the sitemap."* Whoever built this scaffold already knew exactly what was left.

---

## 3. Component Audit

Usage counts are from a repo-wide grep, excluding the component's own definition file.

### Layout (2)

| Component | Used in | Reusable? | CMS-driven? |
|---|---|---|---|
| `layout/Navbar.tsx` | Root layout (site-wide) | N/A — singleton | ❌ Should be — hardcoded `navLinks` array; `navigation.service.ts` already exists and is unused here |
| `layout/Footer.tsx` | Root layout (site-wide) | N/A — singleton | ❌ Should be — hardcoded `footerLinks` + contact info that **contradicts** the contact page's own hardcoded contact info (see §4) |

### UI primitives (14) — `src/components/ui`

| Component | Used in | Reusable? | CMS-driven? |
|---|---|---|---|
| `Container.tsx` | 42 files | ✅ Yes — the layout backbone | No — pure layout, correct |
| `GradientText.tsx` | 25 files | ✅ Yes | No — styling only |
| `Heading.tsx` | 23 files | ✅ Yes | No |
| `SectionEyebrow.tsx` | 21 files (common/) | ✅ Yes | No |
| `Card.tsx` | 9 files | ✅ Yes | No |
| `Badge.tsx` | 7 files | ✅ Yes | No |
| `button-variants.ts` (cva) | 8 files call `buttonVariants` directly | ✅ Yes | No |
| `Button.tsx` | 2 files | ✅ Yes, underused — most call-sites use `buttonVariants()` on a raw `<Link>`/`<button>` instead of the component | No |
| `Input.tsx` / `Select.tsx` / `Textarea.tsx` | ContactForm only (Select also imported, unused, in SelectedWork.tsx) | ✅ Yes | No |
| `IconCircle.tsx` | 2 files direct + via FeatureGrid | ✅ Yes | Indirectly — see FeatureGrid icon issue in §4 |
| `Glow.tsx` | 1 file (HeroSection) | Yes, underused | No |
| `BlurBlob.tsx` | 0 files | ❌ Dead code | — |
| `GlassSurface.tsx` | 0 files | ❌ Dead code | — |
| `Section.tsx` | 0 files | ❌ Dead code | — |

### Common (6) — `src/components/common`

| Component | Used in | Reusable? | CMS-driven? |
|---|---|---|---|
| `FeatureGrid.tsx` | 9 sections (WhatWeDo, Industries, Values, WhySeniorLed, SEOServicesGrid, WhyYouNeedSEO, WhyYouNeedSMM, PlatformSolutions, ServicesGrid) | ✅ Yes — the single most-leveraged content pattern in the app | ⚠️ Blocked — its `icon` prop is typed as a live `LucideIcon` component reference, not a string; WordPress can only return an icon slug or media URL. Every consumer needs an adapter. See §4/§10. |
| `PageHero.tsx` | 8 files (every hero except Home's) | ✅ Yes | Ready — already takes eyebrow/heading/description/buttons/trustedBy as props |
| `EmptyState.tsx` | 2 files | Yes | No |
| `JsonLd.tsx` | 6 files, all in `blog/` + root layout | Yes, underused | N/A |
| `LoadingState.tsx` | 1 file | Yes, underused — only the root `loading.tsx` uses it; blog has its own skeletons instead | No |

### Blog (15) — `src/components/blog` — already CMS-consuming, no changes needed

ArticleContent, AuthorCard, BlogEmptyState, BlogNotFound, BlogSearch, Breadcrumbs, FeaturedPost, NewsletterSection, Pagination, PostCard, PostCardSkeleton, ReadingTime, RelatedPosts, ShareButtons, TableOfContents. All 15 take typed `Post`/domain-shaped props — none contain hardcoded content. This is the template the rest of the site should be refactored toward.

> **Scope note.** These components are built *for the blog* specifically (e.g. `Breadcrumbs`, `ShareButtons`) but are generic enough to reuse on Portfolio/Case Study detail pages once those routes exist — currently they aren't imported anywhere outside `app/blog`.

### Features (1)

`features/contact/ContactForm.tsx` — fully wired: react-hook-form + zod → server action (`actions.ts`) → `contact.service.ts` → `lead.repository.ts` → WordPress REST (`/wp-json/headless/v1/leads`). This is the one form that already talks to real WordPress unconditionally (it has no mock fallback). Its two `<Select>` dropdowns (`serviceOptions`, `budgetOptions`) are hardcoded — `serviceOptions` should be sourced from the same Services list that `service-offering.service.ts` already exposes.

---

## 4. Static Content Audit

Every hardcoded array/object found across `src/sections`, `src/components/layout`, and `src/features`, with exact file and line number.

| Dataset | File : Line | Shape | Items |
|---|---|---|---|
| Hero stats | `sections/home/HeroSection.tsx:10` | `{value, label}` | 3 |
| Trusted-by brand strip | `sections/home/TrustedBrands.tsx:1` | `Array.from(len 8)` | 8 — **bug** |
| What We Do services | `sections/home/WhatWeDo.tsx:13` | `{icon, title, description, href}` | 5 |
| How We Work steps | `sections/home/HowWeWork.tsx:12` | `{step, title, description}` | 6 |
| Founders | `sections/home/AboutJourney.tsx:13` | `{name, role}` | 2 |
| Selected Work / projects | `sections/home/SelectedWork.tsx:12` | `{client, stat}` | 2 |
| Testimonials | `sections/home/Testimonials.tsx:10` | `{quote, name, title}` | 3 |
| Industries | `sections/home/Industries.tsx:21` | `{icon, title}` | 8 |
| Three-Part Journey | `sections/shared/ThreePartJourney.tsx:9` | `{icon, title, description, points[]}` | 3 |
| FAQ | `sections/shared/FAQ.tsx:13` | `{question, answer}` | 5 |
| Why-TFF comparison | `sections/shared/WhyTFF.tsx:12, :20` | `string[]` × 2 | 5 + 5 |
| Values | `sections/about/Values.tsx:11` | `{icon, title, description}` | 4 |
| About stats | `sections/about/OurStory.tsx:11` | `{value, label}` | 4 — **bug** |
| Culture perks | `sections/about/OurCulture.tsx:10` | `string[]` | 4 |
| Team | `sections/about/Team.tsx:12` | `Array.from(len 4)` | 4 — **bug** |
| Business info | `sections/contact/ContactFormSection.tsx:11` | `{icon, label}` | 3 |
| Social links (contact) | `sections/contact/ContactFormSection.tsx:17` | `{label, href="#", icon}` | 3 — stub |
| SMM trusted-by | `sections/smm/SMMHero.tsx:5` | `string[]` | 4 |
| SMM value points | `sections/smm/WhyYouNeedSMM.tsx:11` | `{icon, title, description}` | 3 |
| SMM platforms | `sections/smm/PlatformSolutions.tsx:12` | `{icon, title, description}` | 6 |
| SEO trusted-by | `sections/seo/SEOHero.tsx:5` | `string[]` | 4 |
| SEO value points | `sections/seo/WhyYouNeedSEO.tsx:11` | `{icon, title, description}` | 3 |
| SEO services grid | `sections/seo/SEOServicesGrid.tsx:12` | `{icon, title, description}` | 6 |
| Services (master grid) | `sections/services/ServicesGrid.tsx:18` | `{icon, title, description, href}` | 9 |
| Why Senior-Led points | `sections/services/WhySeniorLed.tsx:12` | `{icon, title, description}` | 4 |
| Primary nav links | `components/layout/Navbar.tsx:11` | `{label, href}` | 7 |
| Footer link columns | `components/layout/Footer.tsx:11` | `{Services[], "Quick Links"[]}` | 6 + 6 |
| Footer social links | `components/layout/Footer.tsx:30` | `{label, href="#", icon}` | 3 — stub |
| Contact form dropdowns | `features/contact/ContactForm.tsx:13, :23` | `{label, value}` × 2 | 7 + 4 |

### Data-integrity bugs found while auditing

**Contradictory contact info.** Two different sources of truth for the same business. `ContactFormSection.tsx:12-14` lists `hello@targetfindfinish.com`, `+1 (512) 555-0128`. `Footer.tsx:108-114` lists `hello@tffdigital.com`, `+1 (415) 555-0132`. Different email domains, different phone numbers, same company. This is exactly the class of bug a single WordPress "Site Settings" options page eliminates by construction.

**Inconsistent statistics.** Home's Hero stats (`HeroSection.tsx:10` — 320+ projects, 98% satisfaction, 12+ years) and About's stats (`OurStory.tsx:11` — 210+ brands, $480M+ revenue, 40+ operators, 94% retention) are two unrelated, independently-hardcoded stat blocks describing the same company with no shared source.

**Placeholder data that reads as broken, not just fake.** `Team.tsx:12-16` generates 4 team cards that are all *literally identical* — same name "Name", same position "Position", same bio — via `Array.from({length:4}, () => ({...}))`. `TrustedBrands.tsx:1` generates 8 distinct strings ("Halcyon 1"…"Halcyon 8") but the render loop at line 12 ignores the generated value and always prints the literal word "Halcyon". Both will visibly repeat on screen today, not just contain lorem-ipsum text.

**FeatureGrid's icon prop can't hold WordPress data.** `components/common/FeatureGrid.tsx:14` types `icon: LucideIcon` — a React component reference. This prop is fed by 9 of the hardcoded arrays above. WordPress/WPGraphQL can only return an icon *slug* (string) or a media/SVG *URL* — never a JS component. Every one of those 9 sections needs either an icon-slug→`LucideIcon` lookup table, or `FeatureGrid` needs a second render path for image/SVG media (the GraphQL fragments for `Service` and `CaseStudy` already model `icon` as a `Media` object, which anticipates the second option).

---

## 5. WordPress Migration Map

Primary content types first — grouped exactly as your WordPress instance models them. Difficulty reflects *remaining* work only.

### Services — Difficulty: Medium

| | |
|---|---|
| Current file | `WhatWeDo.tsx:13`, `ServicesGrid.tsx:18`, `SEOServicesGrid.tsx:12` |
| Current data | 3 separate hardcoded arrays describing overlapping but non-identical service lists (5, 9, and 6 items) |
| WP endpoint | `GET_SERVICES`, `GET_SERVICE_BY_SLUG` — **already written** |
| Difficulty | Medium — backend done, icon-typing mismatch (§4) blocks a direct swap |
| Strategy | Call `getServiceOfferings()` in ServicesGrid + WhatWeDo. Build `/services/[slug]`, retire the 2 one-off pages. Resolve the icon-as-media vs icon-as-component gap once, reuse everywhere. |

### Projects (Portfolio) — Difficulty: Medium

| | |
|---|---|
| Current file | `SelectedWork.tsx:12` |
| Current data | 2 items, `{client, stat}` only — far thinner than the domain model already defined for it |
| WP endpoint | `GET_PORTFOLIO_ITEMS`, `GET_PORTFOLIO_ITEM_BY_SLUG` — **already written** |
| Difficulty | Medium — zero UI exists; backend is complete |
| Strategy | Build `/portfolio` + `/portfolio/[slug]` following the blog route pattern. Swap SelectedWork's teaser to `getPortfolioItems({first:2})`. Add both routes back into `sitemap.ts`. |

### Case Studies — Difficulty: Medium

| | |
|---|---|
| Current file | — (not surfaced anywhere in UI) |
| Current data | None hardcoded — this type has no frontend presence at all today, hardcoded or otherwise |
| WP endpoint | `GET_CASE_STUDIES`, `GET_CASE_STUDY_BY_SLUG` — **already written** |
| Difficulty | Medium — richest domain model of the three (`metrics[]`, `relatedServices[]`) but nothing consumes it |
| Strategy | Build `/case-studies` + `/case-studies/[slug]`. Render `metrics[]` as the stat badges already used decoratively in SelectedWork. Cross-link via `relatedServices[]` on the Service detail page. |

### Team — Difficulty: Hard

| | |
|---|---|
| Current file | `Team.tsx:12` |
| Current data | 4 identical placeholder cards `{name, position, bio}` — see §4 bug |
| WP endpoint | None exists |
| Difficulty | Hard — zero code-side plumbing; build the full chain from scratch |
| Strategy | New CPT/ACF group: name, role, bio, photo, order, optional socials. Add `types/api/wp-team-member.ts`, `domain/team-member.ts`. Mirror `service-offering.*` exactly: adapter → repository → service → mock fixture → GraphQL query. |

### Testimonials — Difficulty: Hard

| | |
|---|---|
| Current file | `Testimonials.tsx:10` |
| Current data | 3 items `{quote, name, title}` — no rating field despite 5 stars rendered statically for every card |
| WP endpoint | None exists |
| Difficulty | Hard — build from scratch |
| Strategy | New CPT/ACF group: quote, author name, author title/company, avatar, rating, order, optional linked Service. Same 5-layer pattern as Team. Star rating becomes a real field, not a hardcoded 5/5. |

### FAQs — Difficulty: Hard

| | |
|---|---|
| Current file | `FAQ.tsx:13` |
| Current data | 5 items, reused **verbatim, unfiltered** on Home, Services, About, and Contact — the same 5 questions regardless of page context |
| WP endpoint | None exists |
| Difficulty | Hard — needs a page-scoping mechanism, not just a list |
| Strategy | New CPT: question, answer, order. Add a taxonomy or relationship field ("shown on") so pages can pull a scoped subset instead of one global list. Same 5-layer pattern; `FAQ` component becomes purely presentational (already is). |

### Statistics — Difficulty: Medium

| | |
|---|---|
| Current file | `HeroSection.tsx:10`, `OurStory.tsx:11` |
| Current data | Two independent, mutually-inconsistent `{value,label}` arrays (§4 bug) |
| WP endpoint | None — needs an options page, not a CPT |
| Difficulty | Medium |
| Strategy | ACF Options Page: single repeater field "Company Stats". Both sections read the *same* field, resolving the inconsistency by construction. |

### Pricing — Not present

| | |
|---|---|
| Current file | — none found |
| Current data | No pricing table, plan grid, or price field exists anywhere in the codebase — "Check Pricing" CTAs on SEOHero/SMMHero link straight to `/contact` |
| WP endpoint | N/A |
| Strategy | Confirm with stakeholders whether pricing is intentionally sales-assisted (current behavior) before building a CPT for it. |

### Secondary / page-copy datasets

Smaller UI-copy arrays that don't map to a WordPress content type 1:1 — better modeled as an ACF flexible-content "Page Options" group per page, or left as code-level copy if truly static marketing language.

| Dataset | File | Recommended home | Difficulty |
|---|---|---|---|
| Industries served | `Industries.tsx:21` | ACF repeater (Home page options) | Easy |
| Company values | `Values.tsx:11` | ACF repeater (About page options) | Easy |
| Culture perks | `OurCulture.tsx:10` | ACF repeater (About page options) | Easy |
| Three-Part Journey | `ThreePartJourney.tsx:9` | Shared ACF block (used on Home + About — needs to be a reusable global, not per-page) | Medium |
| Why-TFF comparison | `WhyTFF.tsx:12,20` | ACF repeater pair (Global options) | Easy |
| How We Work steps | `HowWeWork.tsx:12` | ACF repeater (Home page options) | Easy |
| Trusted-by logos | `TrustedBrands.tsx:1`, `SEOHero.tsx:5`, `SMMHero.tsx:5` | Global media-gallery field (currently fake names, not even real logos) | Easy |
| Primary + footer nav | `Navbar.tsx:11`, `Footer.tsx:11` | `navigation.service.ts` — already built, just needs to be called | Easy |
| Business contact info + socials | `ContactFormSection.tsx:11,17`, `Footer.tsx:30,108` | New "Site Settings" ACF Options Page — resolves the §4 contradiction | Easy |
| Contact form service dropdown | `ContactForm.tsx:13` | Derive from Services list at build/request time rather than a separate hardcoded copy | Easy |

---

## 6. Missing Features

Checked against a modern agency site + the "Future: Blog, Categories, Tags" scope. Blog is far more complete than the "future" label suggests.

| Feature | Status | Detail |
|---|---|---|
| Blog Listing | ✅ Present | `/blog`, paginated, searchable |
| Single Blog Post | ✅ Present | Full detail page w/ TOC, related posts, share |
| Search | ⚠️ Partial | Blog-only (`?q=`); no site-wide search |
| Categories | ✅ Present | `/blog/category/[slug]` |
| Tags | ✅ Present | `/blog/tag/[slug]` |
| Related Posts | ✅ Present | Same-category, current post excluded |
| Author | ✅ Present | `AuthorCard.tsx`, byline on post |
| Reading Time | ✅ Present | Computed from content |
| Breadcrumbs | ⚠️ Partial | Blog only; no other page has them |
| Sitemap | ⚠️ Partial | Generated, but excludes 5 planned routes (§2) |
| RSS | ❌ Missing | No `rss.xml` route |
| Pagination | ✅ Present | Blog listing/category/tag |
| Share Buttons | ✅ Present | Blog post only |
| Newsletter | ⚠️ UI only | Two separate forms (Footer, NewsletterSection), neither persists anywhere; component's own comment says so |
| CMS Search | ✅ Present | `getPostsBySearch` via WPGraphQL/mock |
| Dynamic Metadata | ⚠️ Partial | Blog only via `generateMetadata`; marketing pages are static `export const metadata` |
| OpenGraph | ⚠️ Partial | Layout default + blog per-post; nowhere else |
| Schema (JSON-LD) | ⚠️ Partial | Organization/WebSite (global) + BreadcrumbList/BlogPosting (blog only) |
| Robots | ✅ Present | Allow-all + sitemap pointer |
| 404 | ✅ Present | On-brand, useful links out |
| Loading states | ✅ Present | Root + all 4 blog dynamic routes |
| Error pages | ✅ Present | Route-level + global-error fallback |

### Additional gaps not in the checklist above

- **Portfolio and Case Studies** have no UI at all (§2, §5) — a bigger gap than any item above.
- **No site-wide search** — an agency site with Services + Portfolio + Case Studies + Blog will want one search surface, not four separate ones.
- **No `/services/[slug]` for 7 of 9 services** — those cards link to the generic hub instead of a dedicated page (§4).
- **Newsletter has no backend** — flagged directly in the code's own comment (`NewsletterSection.tsx:10-15`): "there is no newsletter CPT/endpoint in the WordPress architecture yet."
- **Social links are placeholders** — every social icon across Footer and ContactFormSection links to `href="#"`.

---

## 7. SEO Audit

| Mechanism | Coverage | Detail |
|---|---|---|
| `metadata` export | All pages | Every page sets title/description/canonical, but as a static hand-written object except blog |
| `generateMetadata` | Blog only | Used in `blog/[slug]`, `blog/category/[slug]`, `blog/tag/[slug]` — pulls real per-entity SEO via `buildMetadata(post.seo, …)` |
| OpenGraph | Partial | Site-wide default in `layout.tsx` (siteName/type/locale only, no image); per-post OG image/title/description on blog only |
| Twitter Card | Partial | Global default `summary_large_image`; per-post override on blog only |
| Canonical | All pages | Every page (including marketing pages) sets `alternates.canonical` via `getCanonicalUrl()` — one of the more complete pieces |
| Robots meta | Blog only | `buildMetadata()` maps `seo.robots.{index,follow}`; marketing pages never set page-level robots directives (fine while everything should be indexed, but no override exists if one page needs `noindex`) |
| `sitemap.xml` | Partial | Dynamic, includes all posts + 7 static routes; intentionally excludes Portfolio/Case Studies/per-service routes because they don't exist (§2) |
| JSON-LD | Partial | `Organization` + `WebSite` globally; `BreadcrumbList` + `BlogPosting` on blog only. No `Service`, `LocalBusiness`/`ProfessionalService`, `FAQPage`, or `Person` (team) schema anywhere, despite having Services, FAQ, and Team content on-page |

### Configuration gaps

- `src/config/seo.config.ts` has `defaultDescription: ""`, `twitterHandle: ""`, `defaultOgImage: null` — all unset. `buildMetadata()` falls back to these for any page missing WP-side SEO data, so right now that fallback is empty.
- `src/config/site.config.ts` reads `NEXT_PUBLIC_SITE_NAME` with a fallback of the literal string `"Website"` — not set in `.env.example` beyond an empty placeholder.
- `public/` is completely empty — no `og-image`, no `favicon.svg`, no `apple-touch-icon`. Only `src/app/favicon.ico` exists.

---

## 8. Performance Audit

| Technique | Status | Detail |
|---|---|---|
| `next/image` | 3 files | Only `PostCard.tsx`, `FeaturedPost.tsx`, `AuthorCard.tsx` (all blog). Every marketing section uses a Lucide icon (`User`, `Building2`) as a visual placeholder instead of a real image — expected at this stage, but means zero non-blog image optimization is exercised yet. |
| Dynamic imports (`next/dynamic`) | None | Not used anywhere in the codebase. |
| `Suspense` | None | Not used anywhere — `loading.tsx` boundaries provide route-level loading, but no component-level streaming. |
| Lazy loading | Implicit only | Framer Motion's `whileInView` defers animation start, not data/asset loading. No explicit below-fold deferral. |
| Server vs. Client components | Good split | 40 of 198 files (~20%) are `"use client"`; the rest render on the server by default — a healthy ratio. |
| SSG | Default | Marketing pages have no dynamic segments/data and will statically render. |
| SSR | Blog listing/search | `blog/page.tsx` reads `searchParams`, forcing dynamic rendering per request — correct for search/pagination. |
| ISR | Not configured | No `revalidate` export or `next: {revalidate}` fetch option found anywhere, including in `post.repository.ts`. Once live data is connected, every GraphQL/REST call will use Next's default fetch caching behavior with no explicit tag/time-based invalidation strategy — worth deciding deliberately rather than inheriting defaults. |
| Caching strategy | Unset | `lib/wordpress/client.ts`'s `fetchGraphQL()` accepts `cache`/`next` options but no repository call passes them — every request currently takes Next's default. |
| Bundle size levers | In place | `experimental.optimizePackageImports` for `lucide-react` + `framer-motion` in `next.config.ts`; Turbopack for dev + build. |

---

## 9. WordPress Readiness Score

1 = entirely hardcoded, no backend. 10 = fully CMS-driven, production-ready. Score reflects *remaining* work, not code quality.

| Page | Score |
|---|---|
| Blog (listing, post, category, tag) | 9 |
| Sitemap / robots | 8 |
| Contact | 7 |
| Services (hub) | 6 |
| 404 / error / loading | 10 |
| Portfolio (list + detail) — not built | 5 |
| Case Studies (list + detail) — not built | 5 |
| Service detail (SEO, SMM) | 4 |
| Home | 3 |
| About | 3 |

Home and About score lowest despite being the most-visited pages — every section on both is a local array, and About additionally depends on the not-yet-built Team content type.

---

## 10. Missing CMS Features

Exactly what needs to exist in WordPress that doesn't yet, beyond the five content types already configured.

### New content types required

| Type | Fields needed | Notes |
|---|---|---|
| Team Member | name, role/position, bio, photo, display order, optional social links | CPT or ACF repeater on an Options page — a repeater is sufficient unless individual team-member pages are wanted later |
| Testimonial | quote, author name, author title/company, avatar, star rating, display order, optional related Service | Rating is rendered as a static 5-star row today; make it a real field |
| FAQ | question, answer, display order, **page/context association** | The association field is the important part — without it every page keeps showing the same 5 global questions |

### New fields required on existing types

- **Service** — the existing GraphQL fragment already covers `icon`, `featuredImage`, `content`, `summary`, `menuOrder`, `seo`. Nothing missing structurally; the migration is purely code-side (§5).
- **Site Settings (new Options Page)** — single business email, single phone, single address, social links (LinkedIn/Instagram/YouTube/X), default OG image, Twitter handle. Eliminates the Footer/ContactFormSection contradiction in §4 by making one field the only place this data can live.
- **Home Page Options** — hero stat trio, trusted-by logo gallery, "How We Work" step repeater, industries repeater.
- **About Page Options** — company stats repeater (shared with Home's, or explicitly reconciled), values repeater, culture perks list.
- **Global "Three-Part Journey" block** — used identically on Home and About; needs to live once, not be duplicated per page.
- **Global "Why TFF" comparison block** — two parallel string lists (typical agencies vs. this agency).

### Icon strategy decision (blocks 9 sections)

Every repeater/CPT above that includes an `icon` needs one decision made once: either (a) an icon-picker field returning a slug string, matched against a maintained slug→`LucideIcon` lookup table in code, or (b) an SVG/image upload field, with `FeatureGrid` gaining an image-render path alongside its current component-render path. The `Service`/`CaseStudy` GraphQL fragments already model `icon` as `Media`, which points toward option (b).

---

## 11. Suggested Folder Structure

The target structure for a production headless-WordPress Next.js app, annotated against what already exists here. `+ new` marks what's net-new; `✓ exists` marks what already matches this shape.

```
src/
├── app/                          # routes only — thin, no business logic
│   ├── page.tsx                  ✓ exists
│   ├── about/page.tsx            ✓ exists
│   ├── services/
│   │   ├── page.tsx              ✓ exists
│   │   └── [slug]/page.tsx       + new — replaces seo/, smm/
│   ├── portfolio/
│   │   ├── page.tsx              + new
│   │   └── [slug]/page.tsx       + new
│   ├── case-studies/
│   │   ├── page.tsx              + new
│   │   └── [slug]/page.tsx       + new
│   ├── blog/                     ✓ exists — reference implementation
│   ├── contact/page.tsx          ✓ exists
│   ├── rss.xml/route.ts          + new (§6)
│   ├── sitemap.ts                ✓ exists
│   └── robots.ts                 ✓ exists
│
├── sections/                     ✓ exists — pattern holds
├── components/{ui,common,layout,blog}/  ✓ exists
│   └── portfolio/, case-studies/ # optional — or reuse blog/Breadcrumbs, ShareButtons
│
├── services/                     ✓ exists
│   ├── team.service.ts           + new
│   ├── testimonial.service.ts    + new
│   ├── faq.service.ts            + new
│   └── site-settings.service.ts  + new
├── repositories/                 ✓ exists
│   ├── team.repository.ts        + new
│   ├── testimonial.repository.ts + new
│   ├── faq.repository.ts         + new
│   └── site-settings.repository.ts + new
├── adapters/                     ✓ exists
│   ├── team.adapter.ts           + new
│   ├── testimonial.adapter.ts    + new
│   └── faq.adapter.ts            + new
├── graphql/{queries,fragments}/  ✓ exists
│   ├── team.queries.ts           + new
│   ├── testimonial.queries.ts    + new
│   └── faq.queries.ts            + new
├── types/{api,domain,ui}/        ✓ exists
│   ├── api/wp-team-member.ts     + new
│   ├── api/wp-testimonial.ts     + new
│   ├── api/wp-faq.ts             + new
│   ├── domain/team-member.ts     + new
│   ├── domain/testimonial.ts     + new
│   └── domain/faq.ts             + new
├── lib/mock/                     ✓ exists
│   ├── team-members.mock.ts      + new
│   ├── testimonials.mock.ts      + new
│   └── faqs.mock.ts              + new
├── lib/{wordpress,seo,content,utils}/  ✓ exists — no changes needed
├── schemas/, config/, constants/, styles/  ✓ exists — no changes needed
└── providers/                    # currently empty — fine to leave empty; no global client state needed
```

---

## 12. Final Migration Plan

Ordered so every phase either ships something visible or unblocks the next phase — no phase depends on a later one.

**0. Foundation — connect real WordPress.**
Set `WORDPRESS_GRAPHQL_ENDPOINT`, `WORDPRESS_REST_URL`, `WORDPRESS_MEDIA_HOSTNAME`, flip `WORDPRESS_USE_MOCK_DATA=false`. Confirm the WPGraphQL schema actually exposes `Service`, `PortfolioItem`, `CaseStudy` types matching the queries already written in `src/graphql/queries` — the code was written against an assumed schema shape that needs verifying against the real plugin config (WPGraphQL + WPGraphQL for ACF, or equivalent).

**1. Wire what's already built.**
No new code — point the existing Service/Portfolio/CaseStudy/Navigation/ContentPage repositories at live data and verify each adapter against real responses. This alone validates ~60% of the data layer with zero new UI work.

**2. Ship the two orphaned verticals.**
Build `/portfolio`, `/portfolio/[slug]`, `/case-studies`, `/case-studies/[slug]` — copying the blog route pattern (server component + service call + `generateMetadata` + JSON-LD + breadcrumbs). Add both back to `sitemap.ts`.

**3. Collapse Services onto real data.**
Replace `WhatWeDo.tsx` and `ServicesGrid.tsx`'s hardcoded arrays with `getServiceOfferings()`. Build `/services/[slug]`, retire `/services/seo` and `/services/smm` as one-offs (port their extra sections — Strategy, Platform Solutions — into a flexible-content block so any service can opt into them).

**4. Build the three missing domains.**
Team, Testimonials, FAQ — each gets the full 5-layer treatment (type → adapter → repository → service → mock fixture → GraphQL query), mirroring `service-offering.*` exactly. FAQ additionally needs the page-scoping field from §10 before it can replace the shared component's hardcoded list.

**5. Kill the duplicated data sources.**
Wire `Navbar`/`Footer` to the already-built `navigation.service.ts`. Introduce the Site Settings options page and point *both* `ContactFormSection` and `Footer` at it, resolving the contradictory email/phone (§4) permanently.

**6. Migrate remaining page-copy datasets.**
Stats, Industries, Values, Culture, Three-Part Journey, Why-TFF, How-We-Work, Trusted-by — move to ACF Options Pages per §10. Resolve the icon-typing decision from §4/§10 once and apply it to all 9 affected sections in the same pass.

**7. SEO parity pass.**
Extend `buildMetadata()` + JSON-LD usage from blog-only to every page. Add `Service`/`ProfessionalService` and `FAQPage` schema. Populate `seo.config.ts` defaults, set `NEXT_PUBLIC_SITE_NAME`, add real OG image + favicon assets to `public/`.

**8. Blog polish for the "Future" scope.**
Add an RSS feed route. Wire a real newsletter subscribe endpoint (mirroring the Contact form's server-action pattern, per the code's own TODO comment). Decide an explicit ISR/cache strategy (revalidate time or on-demand tags via a WP webhook) instead of inheriting fetch defaults.

**9. Cutover.**
Smoke-test every route against live WordPress with mock mode off. Keep `src/lib/mock` fixtures for local/offline development and tests rather than deleting them — the mock/live switch is a genuine asset, not scaffolding to remove.

---

*Audit scope: full repository read, no external dependencies inspected beyond `package.json`. All file:line references verified against source at audit time.*
