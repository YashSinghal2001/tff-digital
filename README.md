# TFF Digital — Website

The Next.js frontend for [tffdigital.com](https://www.tffdigital.com), a digital growth agency site. It is a **headless frontend**: all editorial content (Services, Case Studies, Blog Posts, generic Pages, navigation) lives in a separate WordPress installation and reaches this app over WPGraphQL. Static/marketing pages (Home, About, Contact, legal pages) are hardcoded in this repo.

## Tech stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS v4**
- **WordPress** as a headless CMS, queried via **WPGraphQL**, with **ACF** for structured fields and **Yoast SEO** for per-entry metadata
- **Zod** for schema validation (both form input and WordPress response boundaries)
- **React Hook Form** for the contact form
- **Nodemailer** for transactional email (lead notification/confirmation)
- **Framer Motion** for UI animation
- Node's built-in test runner (`node --test`) — no Jest/Vitest

## Architecture

Content flows through one consistent pipeline for every WordPress-backed content type (Services, Case Studies, Blog Posts, generic Pages, Navigation, Taxonomies):

```
GraphQL query → repository (fetch + Zod-validate) → adapter (WP shape → domain type) → service (business rules, caching) → route/render
```

- **`src/graphql/queries/`** — the WPGraphQL query strings.
- **`src/repositories/`** — fetch WordPress and validate the raw response against a Zod schema (`src/schemas/api/`) before anything downstream can see it.
- **`src/adapters/`** — convert the validated WordPress shape into this app's own domain type (`src/types/domain/`); this is also where rich-text HTML is sanitized before it can ever reach `dangerouslySetInnerHTML`.
- **`src/services/`** — the public API routes and pages actually call. This is where mock-vs-live switching, React `cache()` de-duplication, and pagination/ordering logic live.
- **`src/app/`** — the App Router routes that render the domain types.

A dormant `Portfolio`/`Projects` data layer (`portfolio.service.ts` and friends) exists in the codebase but is intentionally unwired — no route, nav entry, or sitemap reference points at it. See the decision header at the top of `src/services/portfolio.service.ts` before touching it.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the values you need (see below)
npm run dev                  # http://localhost:3000
```

Without a configured `WORDPRESS_GRAPHQL_ENDPOINT`, local development automatically serves mock content from `src/lib/mock/` (see `WORDPRESS_USE_MOCK_DATA` below) — you don't need a running WordPress instance to work on the frontend.

## Environment variables

Copy `.env.example` to `.env.local` and fill in what you need. Never commit real values.

### WordPress (server-only)

| Variable | Required | Purpose |
|---|---|---|
| `WORDPRESS_GRAPHQL_ENDPOINT` | Yes in production | The WPGraphQL endpoint. Missing in a production build → every page that needs it fails loudly (by design — see `ARCH-3` below), never silently serves fake content. |
| `WORDPRESS_REST_URL` | Yes (for the contact form) | Base URL for the WordPress REST API, used only to create Leads. |
| `WORDPRESS_MEDIA_HOSTNAME` | Yes in production | The WordPress media host, allowlisted in `next.config.ts`'s image `remotePatterns` and CSP `img-src` so `next/image` can optimize CMS-hosted images. |
| `WORDPRESS_USE_MOCK_DATA` | Optional, dev only | `true` serves `src/lib/mock/` content instead of WordPress. **Ignored in production builds** (`next build`/`next start`) — a production deployment always requires a real endpoint. |

### Site (public)

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Recommended | Canonical origin used to build every canonical URL, OG URL, JSON-LD `@id`, and sitemap entry. Falls back to `https://www.tffdigital.com` if unset. |
| `NEXT_PUBLIC_SITE_NAME` | Optional | Falls back to `"TFF Digital"`. |

### Email / SMTP (server-only)

| Variable | Required | Purpose |
|---|---|---|
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASSWORD` | Yes for lead emails | Mailbox credentials used to send the lead-notification and lead-confirmation emails. Verify connectivity with `npm run email:verify` (never sends an email, just authenticates). |
| `EMAIL_FROM` | Yes for lead emails | The `From` address on both outgoing emails. |
| `LEAD_NOTIFICATION_EMAIL` | Yes for lead emails | Where the internal "new lead" notification is sent. |

A failed/misconfigured SMTP setup never fails a form submission — the lead is already saved to WordPress by the time email is attempted, and email delivery is best-effort.

### WordPress Case Study / Service preview (server-only)

| Variable | Required | Purpose |
|---|---|---|
| `WORDPRESS_PREVIEW_SECRET` | Only if preview is used | Shared secret WordPress appends to its preview redirect link. Must match `TFF_HEADLESS_PREVIEW_SECRET` in the WordPress plugin's `wp-config.php`. |
| `WORDPRESS_PREVIEW_USERNAME`, `WORDPRESS_PREVIEW_APP_PASSWORD` | Only if preview is used | A WordPress user + [Application Password](https://make.wordpress.org/core/2020/11/05/application-passwords-integration-guide/) used server-side to authenticate the draft-content GraphQL query. Never reaches the browser. |

### On-demand revalidation webhook (server-only)

| Variable | Required | Purpose |
|---|---|---|
| `WORDPRESS_REVALIDATE_SECRET` | Optional | Shared secret the WordPress plugin sends as a Bearer token to `POST /api/revalidate`. **Unset = the endpoint is disabled** (returns `503`) and the site simply relies on the 30s time-based ISR window instead — nothing breaks, content just refreshes a little slower. |

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server (Turbopack). |
| `npm run build` | Production build. **Uses `--webpack`, not the Next 16 default Turbopack** — Turbopack fails to compile `src/pages` (which contains only the `_document`/`_error` fallback files needed for a branded 500 page, no real route). See the comment on this script's history in `git log` for `next build --webpack` if this ever needs revisiting after a Next.js upgrade. |
| `npm run start` | Runs the production build. |
| `npm run lint` | ESLint. |
| `npm run typecheck` | `tsc --noEmit`. |
| `npm test` | Runs every `src/**/*.test.ts` under Node's built-in test runner (no Jest/Vitest). Requires Node 22.18+. |
| `npm run format` / `format:check` | Prettier. |
| `npm run email:verify` | Confirms SMTP connectivity/auth without sending an email. |

## Routing

All public routes are WordPress-driven except where noted:

- `/` — homepage (hardcoded sections; Services and featured Case Studies pull live data)
- `/about`, `/contact`, `/thank-you` — hardcoded pages
- `/services`, `/services/[slug]` — WordPress-driven ("Service" content type)
- `/case-studies`, `/case-studies/[slug]` — WordPress-driven ("Case Study" content type)
- `/blog`, `/blog/[slug]`, `/blog/category/[slug]`, `/blog/tag/[slug]` — WordPress-driven (Posts + taxonomies)
- `/[slug]` — a generic route for any other published WordPress **Page**, with a reserved-slug guard (`src/lib/content/reserved-page-slugs.ts`) so a Page can never collide with one of the routes above or with the intentionally-dormant `portfolio`/`projects`/`work` paths
- `/privacy-policy`, `/terms-and-conditions`, `/cookie-policy` — hardcoded legal pages
- `/sitemap.xml`, `/robots.txt` — generated (`src/app/sitemap.ts`, `src/app/robots.ts`)

There is no `/portfolio`, `/projects`, or `/work` route — a WordPress-backed data layer for a future "Projects" feature exists in the codebase but is deliberately not wired into any route (see Architecture above).

## Forms

**Contact form** (`/contact`): React Hook Form + Zod, submitted via a Next.js Server Action (`src/features/contact/actions.ts`) that re-validates on the server regardless of what the client sends. A hidden honeypot field silently drops bot submissions. On success the lead is saved to WordPress (REST), then a notification email and a confirmation email are sent best-effort, and the visitor is routed to `/thank-you`.

**Newsletter signup**: removed. It previously existed in the footer and on `/blog` but had no backend or third-party provider wired up — it only showed a fake "subscribed" message locally. Do not reintroduce a newsletter UI without an approved provider.

## Caching & revalidation

Every WordPress fetch defaults to Next's fetch-level ISR with a **30-second revalidation window** (`src/lib/wordpress/client.ts`). On top of that, `POST /api/revalidate` lets the WordPress plugin push instant cache invalidation when a Service, Case Study, Blog Post, or Page is published/updated/trashed/deleted — but only for the small, fixed set of paths that entry can affect (its own detail page, the relevant listing, the homepage, and the sitemap), never an arbitrary or site-wide purge.

- Authenticated via a Bearer token compared against `WORDPRESS_REVALIDATE_SECRET` (constant-time comparison).
- If that secret isn't configured, the endpoint returns `503` and does nothing — the site still works correctly, just on the 30s ISR window alone.
- Before invalidating anything, it probes whether the CMS is currently reachable; during a CMS outage it revalidates nothing, so a live page never gets torn down into an error just because an edit couldn't be re-fetched.

## Preview / draft mode

Two content types support live WordPress draft preview, reached only via a signed link WordPress itself generates (never something a visitor navigates to directly):

- `/api/preview/case-study`
- `/api/preview/service`

Both require the matching `WORDPRESS_PREVIEW_SECRET` plus a WordPress user's Application Password (`WORDPRESS_PREVIEW_USERNAME` / `WORDPRESS_PREVIEW_APP_PASSWORD`) — the secret alone only flips on this browser's Next.js Draft Mode cookie; the actual draft content still requires the server-held WordPress credential. `GET /api/preview/disable` clears Draft Mode.

Blog Posts do not have this two-layer preview — editors can only "View" a published/scheduled post via WordPress's own permalink, not preview an unpublished draft through this app.

## SEO

- **Canonical strategy**: every canonical/OG/JSON-LD URL is built from `NEXT_PUBLIC_SITE_URL` (`src/lib/seo/canonical.ts`) — the site is fully `www`-canonical.
- **Sitemap** (`src/app/sitemap.ts`): includes static routes plus every published Service, Case Study, Blog Post, category/tag archive, and generic Page — filtered so any CMS "test"/placeholder entries or reserved slugs never appear.
- **Robots** (`src/app/robots.ts`): allows all crawling, points at the sitemap.
- **Metadata**: WordPress/Yoast SEO data (title, description, OG image, robots directives) flows through the GraphQL `seo` field into `buildMetadata()` (`src/lib/seo/metadata.ts`), with content-derived fallbacks when Yoast data is missing.
- **JSON-LD**: sitewide `Organization`/`WebSite` in the root layout, plus per-page `BreadcrumbList`, `CreativeWork` (Case Studies), and `BlogPosting` (Posts) — see `src/lib/seo/json-ld.ts`.

## Security & production headers

Configured in `next.config.ts`: a scoped Content-Security-Policy, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, and `Permissions-Policy`. HSTS is applied at the Vercel platform level for the production domain, not in this repo. Every server-only secret (SMTP, preview, revalidation) is read only in `server-only`-marked modules and never reaches a client bundle. WordPress responses are Zod-validated at the repository boundary before becoming domain objects, and rich-text HTML is sanitized before render. Mock data (`WORDPRESS_USE_MOCK_DATA`) is hard-disabled in production builds regardless of how it's set.

## Deployment

- **Frontend**: Vercel, production domain `https://www.tffdigital.com` (the apex domain redirects to `www`).
- **CMS**: a separately-hosted WordPress installation, reached only via `WORDPRESS_GRAPHQL_ENDPOINT`/`WORDPRESS_REST_URL` — this repo has no CMS infrastructure of its own.
- **Build command**: `next build --webpack` (see the Scripts table above for why).
- Environment variables are set in the Vercel project settings for each environment; `.env.example` is the source of truth for what's needed.

## Maintenance guide

- **Run locally**: `npm install && npm run dev`. Works without WordPress via mock data (see Environment variables).
- **Test/lint/typecheck/build**: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.
- **Update content** (Services, Case Studies, Blog Posts, Pages): edit in WordPress. Changes appear within 30 seconds automatically (ISR), or instantly if the revalidation webhook is configured (see Caching & revalidation).
- **Add/change a Service or Case Study**: no frontend code change needed — these are entirely WordPress-driven. The frontend only needs a change if a genuinely new *kind* of content or page section is being introduced.
- **CMS content not appearing / stale**: check `WORDPRESS_GRAPHQL_ENDPOINT` is set and reachable; confirm the entry is actually *published* in WordPress (not draft/trash); WPGraphQL data is cached up to 30s (or instantly on save if the revalidation webhook is configured — see below).
- **Revalidation not working**: confirm `WORDPRESS_REVALIDATE_SECRET` is set in both Vercel and the WordPress plugin's `wp-config.php` and that they match; a `503` response from `POST /api/revalidate` means the secret isn't configured on the Next.js side (time-based ISR still applies, nothing is broken).
- **SEO configuration**: `src/config/seo.config.ts` (site-wide fallbacks), `src/lib/seo/` (canonical, metadata, sitemap, JSON-LD builders).

## Troubleshooting

- **Intermittent WordPress fetch failures / timeouts**: `src/lib/wordpress/client.ts` enforces an 8-second timeout on every WPGraphQL request and surfaces a typed error; a listing page degrades to an empty state, while a detail page's "primary content" fetch surfaces the route's error boundary rather than a false empty/404. If this happens repeatedly, check the CMS host's own uptime/network egress first — it is hosted independently of this app.
- **A production build/deploy fails on Turbopack**: make sure `npm run build` (which explicitly passes `--webpack`) is the command actually being run — see the Scripts table.
- **A form submission "succeeds" but no email arrives**: this is expected to be non-fatal — check `npm run email:verify` and the `SMTP_*`/`EMAIL_FROM`/`LEAD_NOTIFICATION_EMAIL` variables; the lead itself is still saved to WordPress regardless of email delivery.
- **Preview link doesn't work**: confirm `WORDPRESS_PREVIEW_SECRET` matches WordPress's `TFF_HEADLESS_PREVIEW_SECRET`, and that `WORDPRESS_PREVIEW_APP_PASSWORD` hasn't been revoked in WordPress (Users → Profile → Application Passwords).
- **A new/renamed WordPress entry 404s**: confirm it's *published*, not draft/private/trash, and that its slug isn't one of the reserved slugs in `src/lib/content/reserved-page-slugs.ts` (generic Pages only).
