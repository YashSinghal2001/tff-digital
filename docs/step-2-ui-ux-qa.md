# Step 2 — Full UI/UX QA (Desktop + Mobile)

## Methodology, stated up front

Two distinct verification techniques were used, and this document is explicit
about which one backs each claim:

1. **Automated overflow measurement** — for every route × every required
   viewport width, a same-origin `<iframe>` was set to that exact CSS pixel
   width, the real route was loaded into it in a real Chromium renderer, and
   `document.documentElement.scrollWidth` vs `clientWidth` was read from the
   live DOM after render settled. This is real browser rendering, not a
   code-inference guess — but it only catches horizontal-overflow-class bugs,
   not visual/layout/contrast problems.
2. **Visual screenshot verification** — real screenshots taken via the
   browser automation tool, at real rendered widths (either the actual
   browser window, or a same-origin iframe sized to the target width when the
   window itself could not be resized — see the environment note below).
   Every visual finding and every "confirmed clean" claim below is backed by
   an actual screenshot, not source-code reading.

**Environment constraint discovered this pass**: the browser window in this
session cannot be resized wider than ~1170px CSS width (the underlying
virtual display is only ~1280px wide), so 1440px and 1280px could not be
tested via true browser-window resize. All widths — including 1440, 1280,
1024, and all mobile/transition widths — were instead verified using
same-origin iframes sized to the exact target CSS width. This is still real
rendering (the iframe's document lays out and applies media queries exactly
as it would at that viewport), just not the outer browser chrome. Where this
document says "screenshot-verified," that's what backs it.

## A. Baseline result

- `git status`: only pre-existing untracked docs/WordPress-plugin work from
  prior phases; no code changes present before this pass started.
- `npm run lint`: PASS (re-confirmed after fixes, see §J).
- `npm run build`: PASS (re-confirmed after fixes, see §J).
- Production server started fresh (`next start`) and used for all testing in
  this document.

## B. Desktop overflow sweep — 1440px, 1280px, 1024px

All 11 routes tested: `/`, `/about`, `/services`, `/services/seo`,
`/services/smm`, `/services/wordpress-development`, `/case-studies`,
`/case-studies/test`, `/blog`, `/blog/hello-world`, `/contact`.

**Result: zero horizontal overflow on any route at any of the three desktop
widths.** (`scrollWidth === clientWidth` for all 33 route/width combinations.)

## C. Mobile overflow sweep — 390×844, 375×812, 360×800

Same 11 routes. **Result: zero horizontal overflow on any route at any of the
three mobile widths.**

## D. Transition-width overflow sweep — 430, 768, 834

Same 11 routes (covers the remaining required widths from the full set
360/375/390/430/768/834/1024/1280/1440 not already covered by B/C).
**Result: zero horizontal overflow on any route at any of the three
transition widths.**

## E. Desktop visual walkthrough (screenshot-verified)

Full section-by-section screenshot walkthrough at 1440px width:
- **Homepage**: Header/nav, Hero (stats, floating badges), TrustedBrands,
  WhatWeDo grid, WhyTFF, AboutJourney, SelectedWork, Testimonials, FAQ, CTA
  form, Footer — all clean, no clipping/overflow/misalignment.
- **Services listing**: hero, service cards grid, comparison cards, FAQ — clean.
- **Case study detail** (`/case-studies/test`): header, challenge/solution
  columns, results section, footer — clean layout (content itself is known
  placeholder "Test" data, documented separately as a content issue, not a
  UI bug — see `docs/step-3-wordpress-content-audit.md`).
- **Contact page**: hero, two-column form + business-info/map cards, FAQ,
  footer — clean. Business-info card and map-placeholder card are real,
  intentional design elements (not a layout bug).

## F. Mobile visual walkthrough (390px, screenshot-verified)

Screenshot-verified: Home (full scroll), About (full scroll), Services
(cards), Contact (form + business info + FAQ), Blog listing, Case studies
listing + detail. All single-column stacking, card layouts, and form field
stacking rendered correctly with no clipping or overlap **except** the mobile
navigation menu issue in §G.1.

Two apparent "blank gap" observations during testing were investigated and
ruled out as real bugs: they were caused by this session's own JS-driven
instant `scrollTo()` outrunning Framer Motion's `whileInView` fade-in
animations. Re-screenshotting after an additional ~1–2s wait showed the
content was present and rendered correctly (confirmed on `/about` and
`/contact`, and the FAQ section specifically). This is a testing-method
artifact, not a defect in the app.

## G. Findings

### G.1 — HIGH — Mobile menu has no body scroll lock

**File**: `src/components/layout/Navbar.tsx`

The mobile hamburger menu (`open` state) toggles the dropdown's visibility
but never locks background scroll. Confirmed via computed style while the
menu was open: `document.body` and `document.documentElement` both report
`overflow: visible`. A user can scroll the page underneath while the mobile
nav is open, which is inconsistent with standard mobile nav behavvior and was
explicitly called out as a required check in this QA pass's brief.

### G.2 — MEDIUM — Mobile menu dropdown lets background content bleed through, colliding with its own CTA

**File**: `src/components/layout/Navbar.tsx`

The mobile dropdown panel uses the same `bg-glass backdrop-blur-md`
translucent treatment used elsewhere in the design system. On the homepage,
opening the menu places the dropdown directly on top of the hero, and the
hero's own "Book Free Consultation" button is visible/legible directly behind
and immediately below the dropdown's own identical "Book Free Consultation"
button — two nearly-overlapping copies of the same CTA. This isn't a dislike
of the glass aesthetic (used successfully elsewhere with no content directly
behind it); it's a genuine legibility/collision problem specific to the
expanded mobile dropdown having no backdrop separating it from page content.

### G.3 — MEDIUM — Blog search input has no visible keyboard focus indicator

**File**: `src/components/blog/BlogSearch.tsx:44`

The search `<input>` uses `focus:outline-none` with no replacement focus
style. Every other focusable interactive element in the codebase (`Input`,
`Textarea`, `Select`, `PostCard`, `CaseStudyCard`, `Pagination`,
`ShareButtons`, `FAQ`, `SelectedWork`, `FeaturedPost`, `NewsletterSection`)
consistently pairs `outline-none` with `focus-visible:ring-2
focus-visible:ring-primary/50`. This input is the one inconsistent
exception — a keyboard user tabbing to it gets no visible indication it's
focused (WCAG 2.4.7).

### No issues found

- Horizontal overflow: none at any of the 9 required widths × 11 routes (§B–D).
- FAQ accordion: expand/collapse verified working correctly via real tap
  interaction at mobile width, including switching between items.
- Contact form client-side validation: verified working — submitting the
  empty form surfaces per-field error text and red borders on every invalid
  field (name, email, service, budget, message), with good contrast against
  the dark background. The lead-submission backend itself was not touched or
  tested, per instructions.
- Keyboard focus elsewhere: default browser focus outline is present and
  functional on nav links/buttons (not suppressed) — the codebase's
  `focus-visible:ring-2` pattern is applied consistently except for G.3.
- Card stacking, form field stacking, footer layout: all correct at every
  mobile width tested.
- Visual consistency (typography scale, button styles, card borders/shadows,
  spacing rhythm): consistent across all pages inspected — no accidental
  divergence found.

## H. Interaction QA performed

- Every primary nav link (About/Services/Process/Work/Testimonials/Blog/Contact).
- Mobile hamburger menu open/close (found G.1, G.2).
- FAQ accordion open/collapse/switch (working).
- Contact form empty-submit validation (working).
- Homepage/service/blog/case-study cards — rendering and stacking checked
  visually across viewports; not every individual card link was clicked
  through (would duplicate the route-level overflow/visual checks already
  performed per-route).

## I. Explicitly out of scope, not touched

Backend/GraphQL/repositories/services, sitemap, ISR, SEO, the lead API
contract, WordPress integration, and the pre-existing content-fabrication
issues documented in earlier audit phases (contact info conflicts, stale
Footer service list, "Halcyon"×8, Team/Testimonials placeholder content, Case
Study "Test" content). These are content or backend concerns, not UI/UX
implementation bugs, and are already tracked in
`docs/production-content-audit.md`, `docs/contact-information-audit.md`, and
`docs/step-2-production-content-audit.md`.

## J. Fixes applied

All three findings from §G were confirmed genuine and fixed with the
smallest change that resolved each, preserving the existing design system
(no new colors/components introduced beyond the existing `bg-background`
token already used for the page background elsewhere).

### G.1 + G.2 fix — `src/components/layout/Navbar.tsx`

- Added a `useEffect` that sets `document.body.style.overflow = "hidden"`
  while the mobile menu is open and restores the previous value on close/
  unmount — fixes the missing scroll lock (G.1).
- Added a `fixed inset-0` backdrop (`bg-background/80 backdrop-blur-sm`,
  `lg:hidden`, click-to-close) rendered behind the header's own stacking
  context when the menu is open — fixes the content bleed-through/duplicate
  CTA collision (G.2). Only renders on mobile (`lg:hidden`); desktop nav is
  unaffected (verified by screenshot below).

### G.3 fix — `src/components/blog/BlogSearch.tsx`

- Changed `focus:outline-none` to `outline-none focus-visible:ring-2
  focus-visible:ring-primary/50`, matching the pattern used by every other
  focusable element in the codebase.

### Regression verification (real browser, post-fix, post-rebuild)

- `npm run lint`: PASS (no new warnings/errors).
- `npm run build`: PASS, all 14 routes generated successfully.
- Production server rebuilt and restarted; re-tested live:
  - Mobile menu open at 390px: screenshot-confirmed backdrop now dims page
    content, duplicate-CTA collision gone; `getComputedStyle(body).overflow`
    confirmed `"hidden"` while open.
  - Blog search input: screenshot-confirmed visible focus ring on click/focus.
  - Desktop nav at 1280px: screenshot-confirmed unchanged/unaffected.
  - Overflow re-swept on `/`, `/about`, `/services`, `/blog`, `/contact` at
    390px, 1024px, 1280px post-fix: zero overflow (no regression introduced).
