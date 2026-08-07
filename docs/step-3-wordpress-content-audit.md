# Step 3 — WordPress Production Content Cleanup

## Capability constraint, stated up front

No WordPress content was changed as part of this step. This repository
contains only the Next.js frontend — there is no WordPress codebase, no
wp-admin credentials, no WP-CLI, and no database access available from
this environment. Every WordPress interaction in this document is a
read-only GraphQL query against the public `https://tffdigital.com/graphql`
endpoint. Where a WordPress-side action is recommended, it is written as an
instruction for whoever has wp-admin access to execute — not something
performed here.

## 1. WordPress Content Inspected

All 7 live services, the 1 live blog post, and the 1 live case study — the
entire current content set — queried fresh via GraphQL, including
`databaseId` for precise identification and full field content for the
items already flagged as suspicious.

## 2. Items Confirmed as Test/Sample Content

- **`web-development` (dbId 35) `shortDescription`**: literally the string `"THIS IS LIVE DESCRIPTION TEST"` — unambiguous, not an inference.
- **Blog post `hello-world` (dbId 21)**: slug, author (`"admin"`), and category (`"Uncategorized"`) are all still WordPress's untouched installation defaults — only title/body were edited. Strong convergent evidence this is WordPress's auto-generated sample post.

## 3. Items Safely Cleaned Up

**None.** No WordPress write access exists from this environment (see
above). Nothing below was executed — everything is a recommendation.

## 4. Items Deliberately Left Untouched

- **Case Study "Test" (dbId 110)**: per explicit instruction, left untouched, marked CLIENT DECISION REQUIRED regardless of capability.
- **`ai-consulting` (dbId 93)**: all content fields `null`. Emptiness alone doesn't prove test/abandoned status versus "real service, content not written yet" — no destructive recommendation made.
- **`ai-automation` (dbId 74) title**: content is real and complete; only the title's "Updated" suffix is cosmetic. Not rewritten — Step 3B explicitly prohibits guessing/rewriting titles even when the fix looks obvious.
- **`web-development` long-form `description`**: real, legitimate, well-written copy — not touched even though the sibling `shortDescription` field on the same post is confirmed test content.

## 5. Items Requiring Client Approval

1. Case Study "Test" — real client work or replace/unpublish?
2. `ai-consulting` — real planned service (needs content) or stale duplicate (safe to trash)?
3. `web-development` `shortDescription` — real replacement text needed; cannot be invented.
4. `web-development` / `ai-consulting` / `ai-automation` titles — confirm intended final titles.
5. Blog post "Hello World Live" — real first article, or WordPress's default sample post safe to Draft? (Drafting it would empty `/blog` to zero posts — flagging the visible consequence, not deciding it.)

## 6. Frontend Routes Affected

None — no WordPress content changed, so no route's rendered output changed. All 12 routes tested return 200 against the current live data (see Step 3D verification below), confirming today's baseline is stable.

## 7. Sitemap Impact

None — `/sitemap.xml` still lists exactly the same URLs as before this step, since no content was published/unpublished.

## 8. Final Published Services (unchanged from before this step)

| Slug | Title | Status |
|---|---|---|
| `digital-marketing` | Digital Marketing | Clean |
| `wordpress-development` | WordPress Development | Clean |
| `seo-optimization` | SEO Optimization | Clean |
| `ui-ux-design` | UI/UX Design | Clean |
| `ai-automation` | AI Automation Updated | Real content, suspicious title |
| `web-development` | Web Development 2 | Mixed — real long copy, test short description |
| `ai-consulting` | AI Consulting Updated | Empty, ambiguous |

## 9. Final Published Blog Posts (unchanged)

| Slug | Title | Status |
|---|---|---|
| `hello-world` | Hello World Live | Very likely WordPress default sample post, unconfirmed |

## 10. Final Published Case Studies (unchanged)

| Slug | Title | Status |
|---|---|---|
| `test` | Test | CLIENT DECISION REQUIRED, untouched |
