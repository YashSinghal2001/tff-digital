# Installing the Contact Form WordPress Plugin (Bluehost)

This covers installing `wordpress-plugin/tff-headless-leads/` on the live
WordPress site and verifying it end-to-end. Nothing here can be run from
this repository — every step below happens in `wp-admin`, a terminal with
access to the Bluehost server, or your own machine against the live URL.

## Storage decision — required before the endpoint will accept submissions

The plugin does not choose how leads are stored — you must. Both options
are fully implemented; pick one and set it in `wp-config.php`.

| | **A — Custom post type** (`'cpt'`) | **B — Email only** (`'email'`) |
|---|---|---|
| How it works | Saves each lead as a private `tff_lead` post with meta fields, viewable in a wp-admin menu | Sends `wp_mail()` to the site's admin email; nothing is stored in the database |
| Durability | Lead persists even if the notification email is lost, filtered to spam, or never sent | Single point of failure — if the email doesn't arrive, the lead is gone with no fallback |
| Reliability risk | None beyond normal database reliability | Shared hosting (Bluehost's default PHP `mail()`, which `wp_mail()` wraps unless an SMTP plugin is installed) has a real, well-known history of unreliable outbound delivery — this is a genuine risk, not a formality |
| Historical record / reporting | Yes — every lead is queryable later, e.g. to build a simple leads list | No — only what's in the inbox, until manually deleted |
| Setup effort | None beyond setting the constant (the CPT self-registers) | None beyond setting the constant |

**Recommendation, not a decision made for you**: A is safer as the primary
record given known shared-hosting mail reliability issues; both can run
together by wiring a `wp_mail()` call after a successful CPT save (a small
follow-up, not included here since only one method was authorized to be
"the" persistence path this pass).

Add **exactly one** of these to `wp-config.php`, above the line that says
`/* That's all, stop editing! Happy publishing. */`:

```php
define( 'TFF_LEAD_STORAGE_METHOD', 'cpt' );
// or:
define( 'TFF_LEAD_STORAGE_METHOD', 'email' );
```

If neither is set, the endpoint still installs and responds correctly to
validation testing (see below) but returns a clear `500` with the message
*"TFF_LEAD_STORAGE_METHOD is not set..."* on an otherwise-valid submission
— it will never silently drop a real lead by pretending to succeed.

## 1. Package the plugin as a ZIP

From your local checkout of this repository:

```bash
cd wordpress-plugin
zip -r tff-headless-leads.zip tff-headless-leads
```

This produces `wordpress-plugin/tff-headless-leads.zip` containing a single
`tff-headless-leads/tff-headless-leads.php` file inside a
`tff-headless-leads/` folder — the structure WordPress's plugin uploader
expects.

## 2. Install it in WordPress

1. Log into `https://tffdigital.com/wp-admin/`.
2. **Plugins → Add New Plugin → Upload Plugin.**
3. Choose `tff-headless-leads.zip`, click **Install Now**.

(Alternative, if you have SFTP/File Manager access via Bluehost's cPanel:
upload the `tff-headless-leads` folder directly into
`wp-content/plugins/` — same end result, skips the ZIP step.)

## 3. Set the storage constant, then activate

1. Edit `wp-config.php` (via Bluehost's File Manager or SFTP) and add the
   `TFF_LEAD_STORAGE_METHOD` line from above.
2. Back in `wp-admin` → **Plugins**, find "TFF Headless Leads API" and
   click **Activate**.

## 4. Confirm the REST route exists

```bash
curl -s https://tffdigital.com/wp-json/ | python3 -c "
import json,sys
d = json.load(sys.stdin)
print('headless/v1/leads' in ' '.join(d.get('routes', {}).keys()))
"
```
Should print `True`. (This is the exact same check used earlier in this
project's audit to *prove* the route didn't exist yet — running it again
now is the direct before/after confirmation.)

Or just visit `https://tffdigital.com/wp-json/headless/v1/leads` in a
browser — a `GET` request isn't registered (the route is POST-only), so
you should see:
```json
{"code":"rest_no_route","message":"No route was found matching the URL and request method.","data":{"status":404}}
```
**This specific 404 is expected and correct for a GET request** — it
confirms the namespace exists but rejects the wrong HTTP method, which is
different from the namespace not existing at all (check step above for
that distinction).

## 5. Test a valid POST submission

```bash
curl -s -X POST https://tffdigital.com/wp-json/headless/v1/leads \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Person",
    "email": "test@example.com",
    "phone": "555-0100",
    "company": "Test Co",
    "service_interest": "seo",
    "budget": "2k-5k",
    "message": "This is a manual verification test submission.",
    "source": "manual-verification"
  }'
```

**Expected success response** (HTTP 201):
```json
{"id": 123, "status": "success"}
```
(`id` will be a real post ID if `TFF_LEAD_STORAGE_METHOD` is `'cpt'`, or
`0` if it's `'email'`.)

Check the response status explicitly:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tffdigital.com/wp-json/headless/v1/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","service_interest":"seo","budget":"2k-5k","message":"Manual verification test."}'
```
Should print `201`.

If you chose `'cpt'`: confirm the lead actually saved by checking
**wp-admin → Leads** (the plugin adds this menu) for a private post titled
`Test Person — test@example.com`.

If you chose `'email'`: check the inbox at the site's Settings → General →
Administration Email Address for the notification.

## 6. Test validation failures (expected 4xx)

**Missing required field** (`name` omitted):
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tffdigital.com/wp-json/headless/v1/leads \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","service_interest":"seo","budget":"2k-5k","message":"Missing name field."}'
```
Should print `400`.

**Invalid email format**:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tffdigital.com/wp-json/headless/v1/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"not-an-email","service_interest":"seo","budget":"2k-5k","message":"Invalid email test."}'
```
Should print `400`.

**Malformed/empty message**:
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tffdigital.com/wp-json/headless/v1/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","service_interest":"seo","budget":"2k-5k","message":""}'
```
Should print `400`.

**Oversized field** (name > 200 characters):
```bash
curl -s -o /dev/null -w "%{http_code}\n" -X POST https://tffdigital.com/wp-json/headless/v1/leads \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$(python3 -c 'print("A"*250)')\",\"email\":\"test@example.com\",\"service_interest\":\"seo\",\"budget\":\"2k-5k\",\"message\":\"Oversized name test.\"}"
```
Should print `400`.

**Expected error response shape** for any of the above (WordPress's native
REST error format — this is fine, the frontend never parses it, see
`docs/contact-form-wordpress-endpoint.md` §5):
```json
{"code":"rest_invalid_param","message":"Invalid parameter(s): ...","data":{"status":400,"params":{...}}}
```

## 7. Confirm the real Next.js contact form works

Once steps 1–6 pass:
1. Go to `/contact` on the live site.
2. Fill out and submit the real form with real (or clearly-test) data.
3. Confirm the UI shows the "Message sent" success state, not an error message.
4. Confirm the lead actually landed (wp-admin → Leads, or the notification email, per your chosen storage method).

## 8. Confirm no server errors in Next.js logs

Check your Vercel deployment logs (or local terminal if testing against
`next start`) for the request — it should show a clean `POST` to the
Server Action with no `WordPressError` thrown. If you still see *"We
couldn't reach our server just now"* in the UI after installing and
activating the plugin, re-check step 4 (route registered) before assuming
a frontend issue — the frontend code has not changed and does not need to.

## 9. Deactivating / removing the plugin safely

- **Deactivate** (keeps all saved leads and the `wp-config.php` constant
  intact, just stops the REST route from accepting new submissions):
  **Plugins → TFF Headless Leads API → Deactivate.**
- **Full removal**: deactivate first, then **Delete** from the Plugins
  list. This does **not** delete already-saved `tff_lead` posts (WordPress
  never auto-deletes content on plugin removal) — remove those separately
  via **Leads** in wp-admin if you want them gone too.
- Removing the `TFF_LEAD_STORAGE_METHOD` line from `wp-config.php` is
  optional after deactivation — it has no effect while the plugin isn't
  active.

## What I have not verified, and will not claim

I have not installed this plugin on the live server, and I have no way to
from this repository — there is no WordPress codebase or server access
here. I have not confirmed the route responds correctly on the real
Bluehost environment, and I will not describe the contact form as working
in production until you run the steps above and report back what you see.
