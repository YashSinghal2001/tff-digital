# Contact Form → WordPress REST Endpoint Contract

This documents the exact contract the existing Next.js contact form already
expects. It exists so the WordPress side can implement a matching endpoint
without the frontend needing to change.

## Bug found and fixed while writing this document

Before this document could be written accurately, the *actual* request URL
had to be traced end-to-end (not just the endpoint constant in isolation).

`WORDPRESS_REST_URL` (`.env.local`) is `https://tffdigital.com/wp-json` —
already the REST API root. `src/constants/api.ts` previously defined
`leads: "/wp-json/headless/v1/leads"`, which — concatenated in
`src/lib/wordpress/rest-client.ts` (`` `${wordpressConfig.restUrl}${path}` ``)
— produced:

```
https://tffdigital.com/wp-json/wp-json/headless/v1/leads
```

A double `/wp-json`. WordPress's `register_rest_route()` can only ever
produce single-`/wp-json` URLs — there is no way to make it serve at that
path. This meant that even after WordPress implements the route below, the
existing frontend would still have failed to reach it.

**Fixed**: `src/constants/api.ts` now defines `leads: "/headless/v1/leads"`
(no redundant `/wp-json` prefix). `src/repositories/lead.repository.ts` was
**not** modified — it already just passes the constant through correctly;
the bug was in the constant's value, not the repository's logic. This is
the one code change made in Phase 4A.

The real, correct target URL is now:

```
https://tffdigital.com/wp-json/headless/v1/leads
```

## 1. REST namespace

```
headless/v1
```

## 2. REST route

```
/leads
```

## 3. HTTP method

```
POST
```

## 4. Exact request payload the existing Next.js code sends

Source: `src/services/contact.service.ts` (`submitContactForm`), typed by
`WPLeadRequestBody` in `src/types/api/wp-lead.ts`.

**Headers:**
```
Content-Type: application/json
```
No `Authorization` header is sent (see §10 — this must be a public endpoint).

**Body (JSON):**
```json
{
  "name": "string, required, min 2 chars",
  "email": "string, required, valid email",
  "phone": "string, optional",
  "company": "string, optional",
  "service_interest": "string, required (one of the ContactForm select values, e.g. \"seo\", \"smm\", \"web-design\", \"branding\", \"paid-ads\", \"cro\", \"other\")",
  "budget": "string, required (e.g. \"under-2k\", \"2k-5k\", \"5k-10k\", \"10k-plus\")",
  "message": "string, required, min 10 chars",
  "source": "always the literal string \"website\""
}
```

Field presence is enforced client-side first by
`src/schemas/forms/contact.schema.ts` (Zod) before the request is even sent
— so WordPress can trust `name`, `email`, `service_interest`, `budget`, and
`message` are always present and non-empty by the time it receives them,
though **it must not skip its own server-side validation** (client
validation is a UX convenience, not a security boundary — see §6).

`phone` and `company` are optional and may be **absent from the JSON body
entirely** (the Next.js layer omits `undefined` fields rather than sending
empty strings — WordPress should treat a missing key the same as an empty
value for these two fields).

## 5. Exact response shape the existing Next.js code expects

Parsed by `src/schemas/api/lead.schema.ts` (`wpLeadResponseSchema`) — the
response **must** match this shape or `contact.service.ts` will throw a Zod
parse error, which the Server Action maps to a generic "something went
wrong" message shown to the user (see `src/features/contact/actions.ts`).

**Success (HTTP 200 or 201):**
```json
{
  "id": 123,
  "status": "success",
  "message": "optional string, shown to the user if present"
}
```
- `id`: **required**, a number (WordPress's created post/CPT ID for the lead).
- `status`: **required**, must be the literal string `"success"` for
  `LeadSubmissionResult.success` to become `true`.
- `message`: optional string.

**Application-level error (still valid JSON, still parses)**, e.g. HTTP 200
with a business-logic failure:
```json
{
  "id": 0,
  "status": "error",
  "message": "optional string explaining what went wrong"
}
```
`id` is still required by the schema even in the error case — if there's no
real ID to return, send `0`.

**Transport-level failure** (WordPress unreachable, non-2xx HTTP status, or
a non-JSON response body) is handled entirely by
`src/lib/wordpress/rest-client.ts` before the response schema is ever
touched — any non-2xx status throws a `WordPressError` with `kind: "http"`,
which the Server Action maps to *"We couldn't reach our server just now."*
So WordPress does not need to worry about matching the JSON error shape for
genuine failures (bad request, server error, etc.) — a normal HTTP error
status is sufficient and is handled correctly by the existing frontend.

## 6. Validation rules WordPress must enforce

The frontend's Zod schema is not a substitute for server-side validation —
requests to this endpoint do not have to originate from the Next.js app.
WordPress must independently validate:
- `name`: present, non-empty string (trim, reject if empty after trimming).
- `email`: present, valid email format.
- `message`: present, non-empty (recommend mirroring the frontend's 10-char
  minimum, but not required to match exactly).
- `service_interest`, `budget`: present, non-empty strings. WordPress does
  not need to validate against the frontend's specific option list (`seo`,
  `smm`, etc.) — treat as free-form strings so the endpoint doesn't break if
  the frontend's option list changes independently.
- `phone`, `company`: optional, no format validation required.
- Reject the request (4xx) if `name`, `email`, or `message` is missing or
  empty — this is a case the frontend already handles (see §5's
  transport-error path).

## 7. Sanitization requirements

All string fields must be sanitized before storage/use, using WordPress's
own primitives — not reinvented:
- `name`, `company`, `service_interest`, `budget`, `source`: `sanitize_text_field()`.
- `email`: `sanitize_email()`, and reject if `is_email()` fails.
- `phone`: `sanitize_text_field()` (no phone-format validation needed — the
  frontend doesn't enforce a format either).
- `message`: `sanitize_textarea_field()` (preserves line breaks, strips
  tags/dangerous content).

If the endpoint sends notification emails using these values (e.g. via
`wp_mail()`), also escape appropriately for the output context (e.g.
`esc_html()` if building an HTML email body) — sanitizing on input does not
replace escaping on output.

## 8. Recommended WordPress implementation location

A small, standalone **must-use or regular plugin** (e.g.
`wp-content/plugins/tff-headless-leads/tff-headless-leads.php`), **not** a
theme `functions.php` addition. Reasons:
- Survives a theme change/update without losing the endpoint.
- Keeps the headless-API surface (this endpoint, and any future ones)
  auditable in one place, separate from presentation/theme code.
- Matches how the existing `Service`/`CaseStudy`/`Testimonial` custom
  post types and ACF-to-GraphQL exposure were already set up as
  infrastructure independent of the active theme.

## 9. Exact PHP implementation

```php
<?php
/**
 * Plugin Name: TFF Headless Leads API
 * Description: Public REST endpoint accepting contact form submissions from the Next.js frontend.
 * Version: 1.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

add_action('rest_api_init', function () {
    register_rest_route('headless/v1', '/leads', [
        'methods'             => 'POST',
        'callback'            => 'tff_handle_lead_submission',
        'permission_callback' => '__return_true', // public endpoint, see contract §10
        'args'                => [
            'name' => [
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => fn($value) => is_string($value) && trim($value) !== '',
            ],
            'email' => [
                'required'          => true,
                'sanitize_callback' => 'sanitize_email',
                'validate_callback' => fn($value) => is_email($value) !== false,
            ],
            'phone' => [
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'company' => [
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'service_interest' => [
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => fn($value) => is_string($value) && trim($value) !== '',
            ],
            'budget' => [
                'required'          => true,
                'sanitize_callback' => 'sanitize_text_field',
                'validate_callback' => fn($value) => is_string($value) && trim($value) !== '',
            ],
            'message' => [
                'required'          => true,
                'sanitize_callback' => 'sanitize_textarea_field',
                'validate_callback' => fn($value) => is_string($value) && trim($value) !== '',
            ],
            'source' => [
                'required'          => false,
                'sanitize_callback' => 'sanitize_text_field',
            ],
        ],
    ]);
});

function tff_handle_lead_submission(WP_REST_Request $request) {
    $name    = $request->get_param('name');
    $email   = $request->get_param('email');
    $phone   = $request->get_param('phone') ?? '';
    $company = $request->get_param('company') ?? '';
    $service = $request->get_param('service_interest');
    $budget  = $request->get_param('budget');
    $message = $request->get_param('message');
    $source  = $request->get_param('source') ?? 'website';

    // Persist as a 'lead' CPT (or a custom table — CPT shown here to match
    // the existing project convention of modeling content as post types).
    $lead_id = wp_insert_post([
        'post_type'   => 'lead',
        'post_status' => 'private',
        'post_title'  => sprintf('%s — %s', $name, $email),
        'meta_input'  => [
            'lead_phone'    => $phone,
            'lead_company'  => $company,
            'lead_service'  => $service,
            'lead_budget'   => $budget,
            'lead_message'  => $message,
            'lead_source'   => $source,
            'lead_email'    => $email,
        ],
    ], true);

    if (is_wp_error($lead_id)) {
        return new WP_REST_Response([
            'id'      => 0,
            'status'  => 'error',
            'message' => 'Could not save your message. Please try again.',
        ], 500);
    }

    // Optional: notify the team. Do not let a mail failure fail the request
    // — the lead is already saved.
    wp_mail(
        get_option('admin_email'),
        sprintf('New lead: %s', $name),
        sprintf("Name: %s\nEmail: %s\nPhone: %s\nCompany: %s\nService: %s\nBudget: %s\n\n%s",
            $name, $email, $phone, $company, $service, $budget, $message)
    );

    return new WP_REST_Response([
        'id'     => $lead_id,
        'status' => 'success',
    ], 201);
}
```

The `lead` CPT referenced here does not need to be exposed to WPGraphQL or
be public-facing — it's an internal record, unrelated to the
content-delivery CPTs (`Service`, `CaseStudy`, `Testimonial`) already built
for the frontend. A custom database table is an equally valid alternative
to a CPT if preferred; the endpoint contract above doesn't depend on which
storage mechanism is used behind it.

## 10. Permission/capability decision

`permission_callback` is `__return_true` — **this must be a public,
unauthenticated endpoint.** The requester is an anonymous website visitor
filling out a contact form; they have no WordPress account, session, or
credentials, and requiring one would make the form unusable by its actual
users. This is standard for any public lead-capture/contact endpoint.

This does **not** mean the endpoint is unprotected — protection comes from
input validation/sanitization (§6–7) and, optionally, the anti-spam
measures in §11, not from authentication. Contrast this with WordPress's
own content-management REST routes (`wp/v2/posts` writes, etc.), which
correctly *do* require authentication — this is a different, intentionally
public class of endpoint.

## 11. Anti-spam considerations (follow-up, not implemented now)

The current frontend has no honeypot field, no rate limiting, and no
CAPTCHA. Per the task scope, these are **not** being implemented as part of
making the endpoint work — documenting them here as a deliberate follow-up:

- **Honeypot**: add a hidden form field (e.g. `website_url`) that real users
  never fill in; reject submissions where it's non-empty. Requires a small
  frontend change (`ContactForm.tsx`) in addition to the WordPress side.
- **Rate limiting**: e.g. by IP, at the endpoint or at a reverse-proxy/WAF
  layer (Cloudflare, if in use, or a WordPress rate-limiting plugin).
- **CAPTCHA**: e.g. Cloudflare Turnstile or hCaptcha, added client-side to
  `ContactForm.tsx` and verified server-side in the WordPress callback
  before accepting the submission.

None of these block making the endpoint functional — they're hardening to
layer on afterward.

## 12. CORS

**Not relevant here.** CORS is a browser-enforced restriction on
browser-initiated cross-origin requests. This request is made entirely
server-side: `ContactForm.tsx` (the browser component) calls a Next.js
**Server Action** (`src/features/contact/actions.ts`, `"use server"`),
which runs on the Next.js server and calls WordPress via `fetch()` from
Node.js (`src/lib/wordpress/rest-client.ts`). The browser never talks to
`tffdigital.com/wp-json/...` directly — it only ever talks to the Next.js
app's own origin. No `Access-Control-Allow-Origin` header or other CORS
configuration is needed on the WordPress side for this endpoint to work.
