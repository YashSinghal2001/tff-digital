# Contact Information Audit

Every email address, phone number, address, and social link found in
`src/`, with exact locations, cross-checked for conflicts. No values were
changed in this pass — see "Recommended action" per row for why.

## Emails

| File | Exact value | Where it appears | Conflicts with | Real / placeholder / unknown | Recommended action |
|---|---|---|---|---|---|
| `src/sections/contact/ContactFormSection.tsx:12` | `hello@targetfindfinish.com` | Contact page, "Business info" card | `Footer.tsx:108` (different domain) | Unknown | **BLOCKED — needs owner value** |
| `src/components/layout/Footer.tsx:108` | `hello@tffdigital.com` | Sitewide footer, every page | `ContactFormSection.tsx:12` | Unknown | **BLOCKED — needs owner value** |
| `src/features/contact/ContactForm.tsx:82` | `jane@company.com` | Input `placeholder` attribute, empty-state hint only | — | Intentional placeholder (not a real address, never rendered as a claim) | No action needed |
| `src/components/layout/Footer.tsx:61` | `you@company.com` | Newsletter input `placeholder` | — | Intentional placeholder | No action needed |
| `src/components/blog/NewsletterSection.tsx:60` | `you@company.com` | Newsletter input `placeholder` | — | Intentional placeholder | No action needed |

**On the domain-matching observation, and why I did not act on it**: `hello@tffdigital.com` shares its domain with `NEXT_PUBLIC_SITE_URL` (`https://tffdigital.com`), the value used everywhere else in the app as the canonical domain (sitemap, canonical URLs, Open Graph, JSON-LD). That's a real, code-derivable data point — but domain-matching alone isn't proof of intent; a business can legitimately use a different domain for email than for its website (common during a rebrand — `targetfindfinish.com` reads like it could be the pre-rebrand name, "Target Find Finish" appearing throughout the site's own copy, e.g. `HeroSection.tsx`'s "Target Right. Find Strategy. Finish Strong."). Given the explicit instruction not to guess contact info and the real cost of misdirecting business inquiries, I left both values untouched rather than treat a plausible pattern as authoritative.

## Phone numbers

| File | Exact value | Where it appears | Conflicts with | Real / placeholder / unknown | Recommended action |
|---|---|---|---|---|---|
| `src/sections/contact/ContactFormSection.tsx:13` | `+1 (512) 555-0128` | Contact page, "Business info" card | `Footer.tsx:111` (different number) | **Placeholder** — `555` is the reserved fictional-number exchange, never assigned to a real subscriber | **BLOCKED — needs owner value** |
| `src/components/layout/Footer.tsx:111` | `+1 (415) 555-0132` | Sitewide footer | `ContactFormSection.tsx:13` | **Placeholder** — same reason | **BLOCKED — needs owner value** |
| `src/features/contact/ContactForm.tsx:89` | `(555) 000-0000` | Input `placeholder` attribute | — | Intentional placeholder | No action needed |

Unlike the emails, there's no candidate value here that could be "normalized to" — both displayed numbers are independently fake, so there is no authoritative one to prefer.

## Address

| File | Exact value | Where it appears | Conflicts with | Real / placeholder / unknown | Recommended action |
|---|---|---|---|---|---|
| `src/sections/contact/ContactFormSection.tsx:14` | `Zirakpur, Punjab, India` | Contact page | — (matches Footer) | Unknown | Confirm with owner (lower urgency — no conflict to resolve, just unverified) |
| `src/components/layout/Footer.tsx:114` | `Zirakpur, Punjab, India` | Sitewide footer | — (matches Contact page) | Unknown | Confirm with owner |

Already consistent between the two files — no fix needed, just unverified.

## Social links

| Platform | File | URL | Conflicts with | Status |
|---|---|---|---|---|
| LinkedIn | `ContactFormSection.tsx:18` | `#` | — | Placeholder, consistent |
| Instagram | `ContactFormSection.tsx:19` | `#` | — | Placeholder, consistent |
| YouTube | `ContactFormSection.tsx:20` | `#` | `Footer.tsx:33` lists Twitter here instead | Placeholder + **platform mismatch** |
| LinkedIn | `Footer.tsx:31` | `#` | — | Placeholder, consistent |
| Instagram | `Footer.tsx:32` | `#` | — | Placeholder, consistent |
| Twitter | `Footer.tsx:33` | `#` | `ContactFormSection.tsx:20` lists YouTube here instead | Placeholder + **platform mismatch** |

All six are the literal string `"#"` — no real URL exists to normalize toward for any of them. The YouTube-vs-Twitter mismatch is a genuine inconsistency, but *which* platform the business actually uses is a business fact, not a technical bug — I did not pick one to standardize on. WhatsApp, Calendly, and Facebook: no references found anywhere in `src/`.

## No `mailto:` / `tel:` links exist anywhere

Both the email and phone number are rendered as plain, non-interactive text — not just inconsistent between the two files, but not even clickable/functional as contact affordances in either one. Worth the owner knowing this independent of which values are correct.

## Summary: what's actually blocked vs. what's already fine

**Genuinely blocked (no safe fix possible without real values):** email, phone, social platform/URLs, address confirmation.

**Not blocked, no action needed:** the five `you@company.com`/`jane@company.com`/`(555) 000-0000` occurrences are input placeholder attributes — standard UI pattern, not contact-info claims, already correct as-is.
