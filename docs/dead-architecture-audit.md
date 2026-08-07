# Dead Architecture Audit

Three complete repository → adapter → service → GraphQL-query → type
stacks exist in this codebase with **zero consumers** anywhere in live code
(`src/app`, `src/sections`, `src/components`). Verified by grep, not
assumption — see "Proof" under each. No files were removed in this phase;
this is a report only, as instructed.

## 1. Portfolio

**Files** (7):
- `src/services/portfolio.service.ts`
- `src/repositories/portfolio.repository.ts`
- `src/adapters/portfolio.adapter.ts`
- `src/graphql/queries/portfolio.queries.ts`
- `src/types/api/wp-portfolio.ts`
- `src/types/domain/portfolio-item.ts`
- `src/lib/mock/portfolio-items.mock.ts`

**Proof of zero consumers**: `grep -rl "from \"@/services/portfolio.service\"" src` (excluding the file itself) returns nothing. Same for the repository and adapter imports. No file under `src/app`, `src/sections`, or `src/components` mentions `portfolio`/`Portfolio` at all.

**Route status**: `ROUTES.portfolio` (`/portfolio`) and `ROUTES.portfolioItem(slug)` exist as path constants in `src/constants/routes.ts`, but no `src/app/portfolio/...` route directory exists. `ROUTES.portfolio` is referenced exactly once, inside `src/lib/mock/navigation.mock.ts` — itself unused mock fixture data, not live code.

**Live WordPress schema status** (confirmed in an earlier session phase): the `portfolioItems` field does **not** exist on the live WPGraphQL schema — this was built ahead of a WordPress-side CPT that was never actually created.

**Recommendation: REMOVE** — unless there's a concrete plan to build a `/portfolio` route soon. There's a real, separate WP Page titled "Portfolio" (confirmed live in an earlier phase) which is unrelated to this `PortfolioItem` CPT concept — worth clarifying with the owner whether "Portfolio" is even still a planned content type, since Case Studies now appear to serve that role.

## 2. Content Page (generic WordPress Pages)

**Files** (5):
- `src/services/content-page.service.ts`
- `src/repositories/content-page.repository.ts`
- `src/adapters/content-page.adapter.ts`
- `src/graphql/queries/page.queries.ts`
- `src/types/api/wp-page.ts`
- `src/types/domain/content-page.ts`

**Proof of zero consumers**: same grep pattern, same result — zero imports anywhere outside this chain's own files.

**Context**: this exists to fetch generic WordPress `Page` content (title/content/featuredImage/seo) by slug — the kind of thing `/about`, `/contact`, `/services` *could* use if their copy were WordPress-managed, but all of those routes currently hand-write their own static content instead (confirmed across multiple earlier audit phases).

**Recommendation: KEEP, but flag as intentionally unused for now** — unlike Portfolio, this doesn't depend on a WordPress CPT that doesn't exist; the underlying WordPress `Page` type is a WP core primitive that definitely already works (the same `page` GraphQL type Case Study's `relatedServices` proved reachable). If any static page (e.g. About) is ever migrated to be WordPress-editable, this is the exact layer that would be wired in — removing it now would mean rebuilding an already-correct implementation later for no benefit. Recommend revisiting this decision only if a page-content CMS migration is actually planned.

## 3. Navigation (WordPress menu)

**Files** (5):
- `src/services/navigation.service.ts`
- `src/repositories/navigation.repository.ts`
- `src/adapters/navigation.adapter.ts`
- `src/graphql/queries/navigation.queries.ts`
- `src/types/api/wp-menu.ts`
- `src/types/domain/navigation.ts`
- `src/lib/mock/navigation.mock.ts`

**Proof of zero consumers**: same grep pattern, same result. Explicitly confirmed `Navbar.tsx` and `Footer.tsx` — the only two places navigation data could plausibly be used — both define their own hardcoded `navLinks`/`footerLinks` arrays and contain no reference to `navigation.service` or `getMenuByLocation` at all.

**Recommendation: REMOVE, or KEEP only if WordPress-managed navigation is an actual near-term goal.** Unlike Portfolio, nothing here depends on a nonexistent WP schema — WordPress menus are a core primitive too — but the site's navigation structure (7 links in the header, a 3-column footer) is small and tightly coupled to hardcoded route constants (`ROUTES.blog`, `${ROUTES.home}#work`, etc.) in a way that would need real design work to migrate cleanly to CMS-driven menu items, not just a data-source swap.

## Summary

| Layer | Files | Live consumers | Underlying WP schema exists? | Recommendation |
|---|---|---|---|---|
| Portfolio | 7 | 0 | No (`portfolioItems` confirmed absent from live schema) | **REMOVE** |
| Content Page | 6 | 0 | Yes (WP core `Page` type) | **KEEP** (future-ready, correctly built) |
| Navigation | 7 | 0 | Yes (WP core menu type) | **REMOVE**, or keep only if CMS-driven nav is a near-term goal |

No files were deleted in this phase, per instructions. This is a
recommendation for a future, explicitly-approved cleanup pass.
