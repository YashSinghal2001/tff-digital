# Contact Information Audit

Every email address, phone number, physical address, and social link found
in the source tree, with exact locations. No values are changed here — per
Phase 4E's explicit instructions, none of these can be safely corrected
without the real production values being supplied.

## Email addresses

| Value | File:Line | Type |
|---|---|---|
| `hello@targetfindfinish.com` | `src/sections/contact/ContactFormSection.tsx:12` | **Displayed contact info** |
| `hello@tffdigital.com` | `src/components/layout/Footer.tsx:108` | **Displayed contact info** |
| `you@company.com` | `src/features/contact/ContactForm.tsx:82` | Input placeholder text (not a real address) |
| `you@company.com` | `src/components/layout/Footer.tsx:61` | Newsletter input placeholder text (not a real address) |
| `you@company.com` | `src/components/blog/NewsletterSection.tsx:60` | Newsletter input placeholder text (not a real address) |

**Inconsistency**: `ContactFormSection.tsx` and `Footer.tsx` display two
*different* domains for the same business — `targetfindfinish.com` vs
`tffdigital.com`. Both pages are live simultaneously (`/contact` and every
page's footer), so a visitor sees a different email depending on which one
they read. This needs the owner to confirm the single correct address.

The `you@company.com` placeholders are not a bug — they're standard
`placeholder="..."` attribute text shown in an empty input before a user
types, never displayed as actual contact information.

## Phone numbers

| Value | File:Line | Type |
|---|---|---|
| `+1 (512) 555-0128` | `src/sections/contact/ContactFormSection.tsx:13` | **Displayed contact info** — fake ("555" prefix) |
| `+1 (415) 555-0132` | `src/components/layout/Footer.tsx:111` | **Displayed contact info** — fake ("555" prefix) |
| `(555) 000-0000` | `src/features/contact/ContactForm.tsx:89` | Input placeholder text (not a real number) |

Both displayed numbers use the `555` exchange — the standard
fiction/placeholder convention (US phone numbers `XXX-555-01XX` are
reserved and never assigned to real subscribers). Neither is a working
number. They are also **different numbers** in the two files (different
area codes: 512 vs 415), so even setting aside that both are fake, they
already contradict each other.

## Physical address

| Value | File:Line |
|---|---|
| `Zirakpur, Punjab, India` | `src/sections/contact/ContactFormSection.tsx:14` |
| `Zirakpur, Punjab, India` | `src/components/layout/Footer.tsx:114` |

This one **is** consistent between the two files — same city/state/country
in both places. It's a city-level location only (no street address, no
postal code), and there's no way to confirm from the repository alone
whether this is the real business location or a placeholder — flagging for
owner confirmation rather than assuming either way.

## Social links (`href="#"`)

All six are dead placeholder links — clicking any of them does nothing
(reloads the current page via a bare `#` fragment).

| Platform | File:Line | Section |
|---|---|---|
| LinkedIn | `src/sections/contact/ContactFormSection.tsx:18` | Contact page |
| Instagram | `src/sections/contact/ContactFormSection.tsx:19` | Contact page |
| YouTube | `src/sections/contact/ContactFormSection.tsx:20` | Contact page |
| LinkedIn | `src/components/layout/Footer.tsx:31` | Sitewide footer |
| Instagram | `src/components/layout/Footer.tsx:32` | Sitewide footer |
| Twitter | `src/components/layout/Footer.tsx:33` | Sitewide footer |

**Note**: the Contact page lists YouTube as the third platform; the footer
lists Twitter instead — a third inconsistency (which platforms the business
is actually present on), independent of the fact that none of the six URLs
are real yet.

## What's needed from the owner to resolve this

1. **One** confirmed business email address (currently two conflicting candidates: `hello@targetfindfinish.com`, `hello@tffdigital.com`).
2. **One** confirmed business phone number (currently two conflicting fake placeholders).
3. Confirmation of whether `Zirakpur, Punjab, India` is the real, publishable business location.
4. The real URLs for whichever social platforms the business actually maintains — and confirmation of which platforms those are (LinkedIn/Instagram appear on both; YouTube vs Twitter differs between the two files).

No values were changed in this phase — this document exists so those four
answers can be applied in one pass across both files once available,
without further searching.
