# Step 3 — Full Links / Routes / 404 / Images / Forms Audit

## 1. Baseline

- Branch: `main`, HEAD at start: `2bbc1f1 feat: add dynamic service detail pages`.
- `git status` at start: 3 pre-existing modified files (`docs/contact-information-audit.md`,
  `src/components/blog/BlogSearch.tsx`, `src/components/layout/Navbar.tsx` — all from the
  prior Step 2 UI/UX QA pass) and 5 pre-existing untracked paths (4 docs files +
  `wordpress-plugin/`). All preserved exactly; nothing reset, reverted, or discarded.
- `npm run lint`: PASS (before and after this pass's fixes).
- `npm run build`: PASS (before and after), identical 14-route table both times.

## 2. Route Inventory

**Static**: `/`, `/about`, `/services`, `/services/seo`, `/services/smm`, `/contact`,
`/blog`, `/case-studies`, `/sitemap.xml`, `/robots.txt`.

**Dynamic**: `/blog/[slug]`, `/blog/category/[slug]`, `/blog/tag/[slug]`,
`/case-studies/[slug]`, `/services/[slug]`.

**Not a route** (constant exists, no page): `ROUTES.portfolio` / `ROUTES.portfolioItem`.
No `src/app/portfolio/...` directory exists. Already fully documented as dead
architecture in `docs/dead-architecture-audit.md` from an earlier phase — confirmed
still accurate, not linked from any live UI (only referenced inside
`src/lib/mock/navigation.mock.ts`, itself unused — `Navbar`/`Footer` hardcode their
own link arrays and never import the navigation service/repository/mock chain).

Route matrix (A: exists in `src/app`, B: referenced by internal links, C: in sitemap,
D: reachable in production build):

| Route | A | B | C | D |
|---|---|---|---|---|
| `/` | Yes | Yes | Yes | 200 |
| `/about` | Yes | Yes | Yes | 200 |
| `/services` | Yes | Yes | Yes | 200 |
| `/services/seo` | Yes | Yes | Yes | 200 |
| `/services/smm` | Yes | Yes | Yes | 200 |
| `/services/[slug]` (×7 live) | Yes | Yes | Yes | 200 ×7 |
| `/contact` | Yes | Yes | Yes | 200 |
| `/blog` | Yes | Yes | Yes | 200 |
| `/blog/[slug]` (1 live: hello-world) | Yes | Yes | Yes | 200 |
| `/blog/category/[slug]` | Yes | Yes | No* | 200 |
| `/blog/tag/[slug]` | Yes | Yes | No* | 200 |
| `/case-studies` | Yes | Yes | Yes | 200 |
| `/case-studies/[slug]` (1 live: test) | Yes | Yes | Yes | 200 |
| `/sitemap.xml`, `/robots.txt` | Yes | n/a | n/a | 200 |
| `/portfolio` | **No** | No (only in unused mock) | No | 404 (no page) — expected, not a bug |

\* Category/tag archive pages are linked live from `BlogSidebar.tsx` and correctly
render, but aren't in the static sitemap list since there's no enumerable "all
categories/tags" call in `src/lib/seo/sitemap.ts` — a reasonable, common pattern for
taxonomy archives, not a defect. Noted for awareness, not changed.

## 3. Internal Link Audit

Every `href=` (29 occurrences), `Link` usage, and the one `router.push` call
(`BlogSearch.tsx`, both branches valid) were traced to source. Components taking a
dynamic `href`/`link.href` prop (`Navbar`, `Footer`, `PageHero`, `FeatureGrid`,
`ShareButtons`, `Pagination`, `Breadcrumbs`) were cross-checked against every call
site that supplies the prop value. In-page anchors (`#process`, `#work`,
`#testimonials`, `#grid`) were verified against matching `id="..."` targets in the
DOM — all four resolve correctly. Heading-anchor IDs in blog articles
(`TableOfContents` + `withHeadingIds()`) are generated and injected in a single pass
in `src/lib/content/post-content.ts`, guaranteeing the ToC and the rendered content
never drift apart.

**Result: zero broken internal links found.** Every internal `href` resolves to a
route that exists and returns 200.

Two pre-existing, already-documented **content** (not routing) issues re-confirmed
live, unchanged from earlier audit phases — not fixed here per explicit instruction
not to fabricate content:
- Footer "Services" column: 4 of 6 entries (CRO, PPC, Branding, Web Design & Dev)
  route to the generic `/services` listing rather than a matching individual page,
  since no live WordPress service uses those exact names. Structurally valid link
  (200, not broken), just an IA/content mismatch.
- Contact info (`hello@tffdigital.com` vs `hello@targetfindfinish.com`, two
  different `555` phone numbers) — already tracked in
  `docs/contact-information-audit.md`.

## 4. Dynamic Route / 404 Audit

Tested valid + invalid slugs for all three dynamic route families (blog, case
studies, services — including all 7 live service slugs), plus category/tag
archives, plus malformed paths (`/Blog` case-mismatch, `/blog/`, `/case-studies//`).

**Streaming-200 behavior confirmed and documented, not treated as a bug**: every
route family has a `loading.tsx` sibling, so Next.js streams an initial 200 response
before the async Server Component resolves and calls `notFound()`. `curl -w
"%{http_code}"` reports 200 for invalid slugs as a result — this is expected Next.js
App Router streaming SSR behavior, not a broken route. Verified via real browser
rendering (not just curl) that every invalid slug correctly displays its not-found
UI: "Article not found" (blog), generic "Page not found" (case studies, services —
no route-level `not-found.tsx`, correctly falls through to root), "Category not
found" / "Tag not found" (their own route-level `not-found.tsx` files). Zero console
errors, zero crashes, zero blank pages, zero fake content on any of these.

`/Blog` (capitalized): Linux/Vercel routing is case-sensitive by design — correctly
falls through to the root not-found page, no crash, no console error. Working as
intended.

`/blog/` and `/case-studies//`: normalized automatically to the canonical path by
Next.js's default trailing-slash handling; both resolved and rendered correctly.

## 5. Image Audit

Every image reference in the codebase goes through `next/image` (8 files) — zero
raw `<img>` tags, zero CSS `background-image` URLs anywhere in `src`. Every usage is
correctly null-guarded (`{x.featuredImage ? <Image .../> : null}`), so there is no
crash risk when a piece of content lacks an image — the fallback is an empty
`aspect-[16/9]` placeholder box, not a broken-image icon.

**Live content finding**: querying `https://tffdigital.com/graphql` directly
confirms all 7 services, the 1 blog post, and the 1 case study currently have
`featuredImage: null`. This means **zero content images render anywhere on the site
right now** — confirmed via live network inspection (zero requests to the WordPress
media host on page load). This is a WordPress content gap (no featured images
uploaded), not a code defect; the code already handles it gracefully. Not fixable
from this codebase — requires content upload in wp-admin.

**Genuine bug found and fixed**: the one non-WordPress-content image path —
`AuthorCard.tsx`'s author avatar — resolves live to
`https://secure.gravatar.com/avatar/...` (WordPress's own built-in fallback via
`get_avatar_url()` for any user without a custom avatar, confirmed on the live
"admin" author). `next.config.ts`'s `images.remotePatterns` only allowed the
WordPress media hostname and `placehold.co`, not Gravatar — so `next/image`'s
optimizer rejected every such request with **HTTP 400**, rendering an empty gray
circle instead of the avatar. Fixed by adding `secure.gravatar.com` to
`remotePatterns` (see §11). Verified live post-fix: `200`, real Gravatar
"mystery-person" placeholder icon renders correctly.

`favicon.ico` initially looked missing (`public/` is empty) but is correctly served
via `src/app/favicon.ico` (Next.js App Router convention) — verified live, `200`.
Not a bug; false alarm caught before being reported. `apple-touch-icon.png` 404s,
which is optional/cosmetic (no asset exists to fabricate one from) — not fixed, not
flagged as a blocker.

## 6. Button / CTA Audit

Every `<button>` (8 files) and CTA-styled `Link` traced. All navigation/anchor CTAs
resolve correctly (§3). Interactive-but-inert elements found:

- **Genuine bug, fixed**: `Footer.tsx`'s newsletter form had
  `onSubmit={(event) => event.preventDefault()}` as its entire handler — clicking
  "Subscribe" did visibly nothing: no validation, no confirmation, no error, no
  state change of any kind. This exact "no backend yet" situation already has an
  established, intentional pattern elsewhere in this same codebase —
  `src/components/blog/NewsletterSection.tsx` — which validates the email is
  non-empty and shows a local "You're subscribed — thanks for joining." confirmation
  instead of silently no-op'ing. Fixed by bringing `Footer.tsx` to the same,
  already-decided pattern (§11). This required no new design decision or content —
  it's applying an existing, already-accepted in-codebase solution to its second
  occurrence.
- Error boundary buttons (`error.tsx`, `global-error.tsx` "Try again") correctly
  wired to Next's `reset()` callback — functional, not dead.
- FAQ accordion toggle button — functional (verified via real tap interaction).
- `ShareButtons` "Copy link" button — functional (`navigator.clipboard.writeText`).
- Zero `href="#"` used as a real navigation destination for anything that should
  navigate — the only `href="#"` occurrences are the 6 already-documented,
  intentional social-link placeholders (§7), not disguised dead buttons.

## 7. External / Social Links

- **LinkedIn / Instagram / Twitter** (`Footer.tsx`) and **LinkedIn / Instagram /
  YouTube** (`ContactFormSection.tsx`): all six are the literal string `"#"` — no
  real URL exists anywhere in the codebase to point them to. Platform mismatch
  between the two locations (Twitter vs YouTube in the third slot) already
  documented in `docs/contact-information-audit.md`. Not fabricated, not changed —
  genuinely blocked on real client URLs.
- **ShareButtons** (blog post X/LinkedIn share, and case study `projectUrl` link):
  real, correctly-formed, reachable URLs — `twitter.com/intent/tweet?...` and
  `linkedin.com/sharing/share-offsite/?...` built from the post's real canonical
  URL via `encodeURIComponent`. Case study `projectUrl` (currently
  `https://www.google.com/` — live WordPress "Test" content, not a real client
  site) is a content issue, already flagged in prior-phase audits, not a broken or
  malformed link.
- No `tel:`/`mailto:` links exist anywhere (contact info is plain text) — already
  documented, unchanged.
- No Calendly/booking links found anywhere in the codebase.

## 8. Contact Form — Frontend Audit Only

Verified against `src/features/contact/ContactForm.tsx` and
`src/schemas/forms/contact.schema.ts`, plus live interaction:

- Required: name (min 2 chars), email (valid format), service, budget, message
  (min 10 chars). Phone and company correctly optional.
- Loading state: `disabled={isSubmitting}` + "Sending..." label — present and
  correct (react-hook-form's `isSubmitting` flips synchronously on submit start,
  before any network round-trip, so double-submission is prevented from the first
  click).
- Success UI: "Message sent" confirmation card with a "Send another message" reset.
- Error UI: `role="alert"` red text tied to `submitError` state.
- Validation messages: verified live — submitting empty shows per-field errors with
  clear red-bordered inputs and good contrast.
- The frontend/backend boundary (`src/features/contact/actions.ts`) was read but
  **not modified** — it already never throws across the boundary and returns a
  typed result either way, exactly as the postponed Lead API work from an earlier
  phase left it. No attempt was made to fix or diagnose the backend lead-delivery
  issue; that remains explicitly out of scope for this pass.

## 9. Sitemap Consistency

17 URLs live: 8 static + 1 blog post + 1 case study + 7 services. All unique (no
duplicates), all valid `https://tffdigital.com/...` absolute URLs, all correspond to
real, reachable, 200-status pages. No dead URLs, no malformed URLs. The one
slug that reads like test content (`case-studies/test`) is legitimately published
WordPress content being mirrored correctly by the sitemap — a content decision
already flagged elsewhere as CLIENT DECISION REQUIRED, not a sitemap defect.
Category/tag archive pages are intentionally excluded (see §2 note). **No sitemap
changes made — none were needed.**

## 10. Bugs Found

1. **Gravatar avatar 400 / broken image** — `next.config.ts` — HIGH (visibly broken
   on the one live author). Fixed.
2. **Footer newsletter form silently does nothing** — `src/components/layout/Footer.tsx`
   — MEDIUM (no error, but zero user feedback on every click). Fixed.

No other objectively-broken, reproducible, in-scope defects were found across
routes, internal links, 404 handling, images, buttons, external links, the contact
form's frontend, or the sitemap.

## 11. Bugs Fixed

### `next.config.ts`
Added `{ protocol: "https", hostname: "secure.gravatar.com" }` to
`images.remotePatterns`, alongside the existing WordPress-media and
`placehold.co` entries. One-line, additive change; no other config touched.

### `src/components/layout/Footer.tsx`
Added a `subscribed` state and an `onSubscribe` handler (validates non-empty email,
sets `subscribed`, clears the input) mirroring `NewsletterSection.tsx` exactly; the
form now conditionally renders a "You're subscribed — thanks for joining."
confirmation in place of the input, matching the established in-codebase pattern for
this "no newsletter backend yet" situation. No new visual design, no new copy tone,
no fabricated backend.

Both changes verified via a full `npm run lint` / `npm run build` / restart / live
re-test cycle (§14).

## 12. Known Blockers (Not Fixed, By Design)

| Item | File(s) | Why not fixed | Owner |
|---|---|---|---|
| Zero content images anywhere (all `featuredImage: null`) | WordPress content | Requires uploading real images in wp-admin | Client / WP editor |
| Footer "Services" column mismatched labels | `Footer.tsx` | Requires real IA/naming decision, not a broken link | Client |
| Contact info conflicts (email, phone) | `ContactFormSection.tsx`, `Footer.tsx` | No authoritative value exists to normalize to | Client |
| 6 social links (`href="#"`) | `Footer.tsx`, `ContactFormSection.tsx` | No real social URLs exist to fill in | Client |
| Case study "Test" content, `projectUrl` = google.com | WordPress content | CLIENT DECISION REQUIRED (already flagged in Step 3 WP audit) | Client |
| `apple-touch-icon.png` 404 | `public/` | No brand asset exists to generate one from; cosmetic/optional | Client (if desired) |
| Lead API backend delivery | `wordpress-plugin/`, `actions.ts` | Explicitly postponed, out of scope this pass | Future phase |

## 13. Tests Performed

Automated: full route-table curl sweep (18 routes, before and after fixes).
Live-browser: dynamic-route 404s (6 invalid-slug cases + 3 malformed-path cases,
each screenshot- and console-verified), full nav/anchor click-through (7 header
links, 3 same-page anchors, mobile menu duplicate), service-card → detail,
case-study-card → detail → Related Services → service detail, blog-card → post,
footer link enumeration, contact-form empty-submit validation, footer newsletter
submit (real click + real typing, pre- and post-fix), network-request inspection
(image requests, Gravatar 400 → 200), console-error checks on every navigated page.

## 14. Final `npm run lint` / `npm run build`

Both PASS, both before and after the two fixes. Route table identical
before/after (14 routes, same sizes/revalidate windows) — no regressions
introduced.

## 15. Production Verification Results

Post-fix, full production server restart (with a cleared `.next/cache/images`,
since the Gravatar fix required invalidating a cached 400 response): all 18 routes
re-verified 200, Gravatar avatar confirmed 200 + rendering, footer newsletter
confirmed showing the real confirmation message, zero console errors on every page
re-tested, zero new 404s, zero broken images, zero broken links, zero form
regressions.
