# Placeholder / Fabricated Content Audit

Three sections currently ship fabricated or literally-placeholder content
to real visitors. No files were changed in this phase — see "Why not fixed
now" at the end of each entry.

## 1. `src/sections/about/Team.tsx` — rendered on `/about`

```ts
const team = Array.from({ length: 4 }, () => ({
  name: "Name",
  position: "Position",
  bio: "Former growth lead at two IPO'd SaaS companies.",
}));
```

**Classification**: (2) intentionally temporary placeholder — this isn't
disguised as real content (the literal strings `"Name"` and `"Position"`
are template placeholders, not an attempt at a fake-but-plausible name),
but it is broken: 4 identical cards, each displaying the literal text
"Name" as a person's name and "Position" as their job title, with the same
fabricated bio ("Former growth lead at two IPO'd SaaS companies") repeated
four times.

**Rendered in production**: yes, unconditionally, on `/about`.

**What's needed from the owner**: real team member data — name, role,
headshot photo, and a real bio, for however many people should appear
(currently hardcoded to exactly 4 slots).

**Why not fixed now**: no safe fix exists that doesn't either (a) fabricate
replacement people, which is explicitly disallowed, or (b) remove the
section's visible content entirely, which is a visible homepage-page
content decision beyond this phase's scope (unlike `SelectedWork.tsx`,
which had an explicit, separate instruction authorizing its empty-state
fix in Phase 4D — this file has no equivalent authorization).

## 2. `src/sections/home/Testimonials.tsx` — rendered on `/`

```ts
const testimonials = [
  { quote: "...", name: "Sarah Liu", title: "CMO, Cascade Health" },
  { quote: "...", name: "Marcus Reyes", title: "Founder, Halcyon" },
  { quote: "...", name: "Priya Nair", title: "VP Growth, Northfield" },
];
```

**Classification**: (2) intentionally temporary placeholder, but a more
serious variant — unlike Team.tsx's obviously-fake "Name"/"Position"
strings, these are written as *plausible real people* with full names,
specific job titles, and named companies ("Cascade Health", "Halcyon",
"Northfield"), attributed direct quotes praising the business. Nothing in
the UI signals these are placeholders. A visitor has no way to tell this
from a real testimonial.

**Rendered in production**: yes, unconditionally, on the homepage.

**What's needed from the owner**: real client testimonials — actual quotes
from actual clients who consented to being named, or a decision to source
this from the WordPress `Testimonial` CPT that already exists (confirmed
live in an earlier phase, though its ACF fields aren't yet GraphQL-exposed
or wired into this codebase).

**Why not fixed now**: same reasoning as Team.tsx — no safe fix exists that
doesn't fabricate replacement content or make a silent decision to hide the
section, which Phase 4F did not authorize.

## 3. `src/sections/home/TrustedBrands.tsx` — rendered on `/`

```ts
const brands = Array.from({ length: 8 }, (_, i) => `Halcyon ${i + 1}`);
```

Rendered under the heading "TRUSTED BY AMBITIOUS BRANDS WORLDWIDE" — but
every one of the 8 items displays the literal text "Halcyon" (the loop
variable `i` is generated into the array but never actually rendered — the
JSX hardcodes the string "Halcyon" directly, so all 8 visible items are
identical).

**Classification**: (2) intentionally temporary placeholder, same
severity tier as Testimonials — presented as real client-logo social proof
under an explicit "trusted by" claim, with no visual indication it's
placeholder data.

**Rendered in production**: yes, unconditionally, on the homepage.

**What's needed from the owner**: real client/partner logos (image assets)
and names, and confirmation of which of them have given permission to be
publicly listed as clients.

**Why not fixed now**: same reasoning as the two entries above.

## Summary table

| File | Route | What's shown | Real users see it? | Needs from owner |
|---|---|---|---|---|
| `Team.tsx` | `/about` | 4× literal "Name" / "Position" | Yes | Real team data (name, role, photo, bio) |
| `Testimonials.tsx` | `/` | 3 fabricated named quotes | Yes | Real client testimonials, or wire to the existing WP Testimonial CPT |
| `TrustedBrands.tsx` | `/` | "Halcyon" ×8 | Yes | Real client/partner logos + permission to display |

## `lib/mock/*` — explicitly out of scope of this audit

For contrast: `src/lib/mock/*.ts` also contains placeholder data (mock
posts, mock case studies, etc.), but that's category (3) test/mock data,
gated entirely behind `WORDPRESS_USE_MOCK_DATA` and confirmed unreachable
in production in an earlier phase's environment audit — not included above
because it never renders to a real visitor.
