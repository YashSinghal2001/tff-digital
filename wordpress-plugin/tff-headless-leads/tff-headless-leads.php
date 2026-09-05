<?php
/**
 * Plugin Name:       TFF Headless Leads API
 * Description:       Public REST endpoint (POST /wp-json/headless/v1/leads) that accepts contact-form submissions from the Next.js frontend, headless hardening that keeps this CMS domain (noindex) out of search engines, and View + Preview redirects to the Next.js frontend for Case Studies, Services, and Blog Posts (View only), plus an on-demand revalidation webhook that refreshes the frontend's cached pages when one of those is published, updated, unpublished, trashed or deleted. See docs/contact-form-wordpress-endpoint.md and docs/wordpress-contact-form-installation.md in the tff-digital repository for the full contract.
 * Version:           1.6.0
 * Requires at least: 5.9
 * Requires PHP:      7.4
 * Author:            TFF Digital
 * License:           GPL-2.0-or-later
 *
 * -----------------------------------------------------------------------
 * STORAGE DECISION REQUIRED BEFORE THIS ENDPOINT WILL ACCEPT SUBMISSIONS
 * -----------------------------------------------------------------------
 * This plugin deliberately does NOT choose how leads are persisted. Set
 * exactly one of the following in wp-config.php (above the
 * "That's all, stop editing!" line), or leave both unset and the endpoint
 * will return a clear 500 error rather than silently discarding leads:
 *
 *   define( 'TFF_LEAD_STORAGE_METHOD', 'cpt' );    // Option A: WordPress custom post type
 *   define( 'TFF_LEAD_STORAGE_METHOD', 'email' );  // Option B: email notification only
 *
 * See docs/wordpress-contact-form-installation.md for the trade-offs
 * between the two. Both are fully implemented below — only the constant
 * decides which runs. This is intentional: the request/response contract
 * (validation, sanitization, HTTP status codes, JSON shape) is complete
 * and testable either way; only the persistence backend is a decision
 * left to the site owner.
 * -----------------------------------------------------------------------
 *
 * -----------------------------------------------------------------------
 * HEADLESS PREVIEW REQUIRES ONE SHARED SECRET (Case Studies + Services)
 * -----------------------------------------------------------------------
 * Add this to wp-config.php (above "That's all, stop editing!"), matching
 * the Next.js app's WORDPRESS_PREVIEW_SECRET environment variable exactly:
 *
 *   define( 'TFF_HEADLESS_PREVIEW_SECRET', 'some-long-random-string' );
 *
 * Optional — override only if the frontend origin ever changes:
 *
 *   define( 'TFF_HEADLESS_FRONTEND_URL', 'https://www.tffdigital.com' );
 *
 * Until TFF_HEADLESS_PREVIEW_SECRET is defined, Preview keeps its default
 * WordPress behavior (opens on this CMS domain) for every post type,
 * rather than redirecting anywhere broken. View/permalink redirects (Case
 * Studies, Services, Blog Posts) do not depend on this secret at all — see
 * tff_headless_route_map() vs. tff_headless_preview_route_map() below for
 * exactly which post types get which behavior, and why.
 * -----------------------------------------------------------------------
 *
 * -----------------------------------------------------------------------
 * ON-DEMAND REVALIDATION REQUIRES ONE SHARED SECRET (optional feature)
 * -----------------------------------------------------------------------
 * Add this to wp-config.php, matching the Next.js app's
 * WORDPRESS_REVALIDATE_SECRET environment variable exactly:
 *
 *   define( 'TFF_HEADLESS_REVALIDATE_SECRET', 'another-long-random-string' );
 *
 * With it defined, publishing, updating, unpublishing, trashing or deleting
 * a Case Study, Service or Blog Post POSTs to <frontend>/api/revalidate so
 * the cached frontend pages refresh at once instead of at the next 30s ISR
 * window (tff-digital audit CACHE-1). Until it is defined nothing is sent
 * and the frontend keeps its time-based refresh — see
 * tff_headless_revalidate() below.
 * -----------------------------------------------------------------------
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Do not allow direct access to this file.
}

// ---------------------------------------------------------------------
// Constants (prefixed to avoid collisions with other plugins/themes)
// ---------------------------------------------------------------------

define( 'TFF_HEADLESS_LEADS_NAMESPACE', 'headless/v1' );
define( 'TFF_HEADLESS_LEADS_ROUTE', '/leads' );
define( 'TFF_HEADLESS_LEADS_CPT', 'tff_lead' );

// Maximum accepted lengths per field — generous enough for real submissions,
// tight enough to reject obviously abusive/malformed payloads before they
// ever reach sanitization or storage.
define( 'TFF_HEADLESS_LEADS_MAX_SHORT', 200 );   // name, email, phone, company, service_interest, budget
define( 'TFF_HEADLESS_LEADS_MAX_MESSAGE', 5000 ); // message

// ---------------------------------------------------------------------
// REST route registration
// ---------------------------------------------------------------------

add_action( 'rest_api_init', 'tff_headless_leads_register_route' );

function tff_headless_leads_register_route() {
	register_rest_route(
		TFF_HEADLESS_LEADS_NAMESPACE,
		TFF_HEADLESS_LEADS_ROUTE,
		array(
			'methods'             => WP_REST_Server::CREATABLE, // POST
			'callback'            => 'tff_headless_leads_handle_submission',
			// Public, unauthenticated endpoint by design: the requester is an
			// anonymous website visitor filling out a contact form, not a
			// WordPress user. Protection comes from validation/sanitization
			// below, not from authentication. See contract §10 in
			// docs/contact-form-wordpress-endpoint.md.
			'permission_callback' => '__return_true',
			'args'                => tff_headless_leads_arg_schema(),
		)
	);
}

/**
 * Field schema matching the exact request body the existing Next.js
 * frontend sends (src/types/api/wp-lead.ts, WPLeadRequestBody). Required
 * fields use validate_callback to reject empty/oversized/malformed values
 * with WordPress's standard 400 rest_invalid_param response before the
 * main callback ever runs.
 */
function tff_headless_leads_arg_schema() {
	$required_short_text = array(
		'type'              => 'string',
		'required'          => true,
		'sanitize_callback' => 'sanitize_text_field',
		'validate_callback' => function ( $value ) {
			return is_string( $value )
				&& trim( $value ) !== ''
				&& strlen( $value ) <= TFF_HEADLESS_LEADS_MAX_SHORT;
		},
	);

	return array(
		'name'             => $required_short_text,
		'email'            => array(
			'type'              => 'string',
			'required'          => true,
			'sanitize_callback' => 'sanitize_email',
			'validate_callback' => function ( $value ) {
				return is_string( $value )
					&& strlen( $value ) <= TFF_HEADLESS_LEADS_MAX_SHORT
					&& is_email( $value ) !== false;
			},
		),
		'phone'            => array(
			'type'              => 'string',
			'required'          => false,
			'sanitize_callback' => 'sanitize_text_field',
			'validate_callback' => function ( $value ) {
				return ! is_string( $value ) || strlen( $value ) <= TFF_HEADLESS_LEADS_MAX_SHORT;
			},
		),
		'company'          => array(
			'type'              => 'string',
			'required'          => false,
			'sanitize_callback' => 'sanitize_text_field',
			'validate_callback' => function ( $value ) {
				return ! is_string( $value ) || strlen( $value ) <= TFF_HEADLESS_LEADS_MAX_SHORT;
			},
		),
		'service_interest' => $required_short_text,
		'budget'           => $required_short_text,
		'message'          => array(
			'type'              => 'string',
			'required'          => true,
			'sanitize_callback' => 'sanitize_textarea_field',
			'validate_callback' => function ( $value ) {
				return is_string( $value )
					&& trim( $value ) !== ''
					&& strlen( $value ) <= TFF_HEADLESS_LEADS_MAX_MESSAGE;
			},
		),
		'source'           => array(
			'type'              => 'string',
			'required'          => false,
			'sanitize_callback' => 'sanitize_text_field',
			'validate_callback' => function ( $value ) {
				return ! is_string( $value ) || strlen( $value ) <= TFF_HEADLESS_LEADS_MAX_SHORT;
			},
		),
	);
}

// ---------------------------------------------------------------------
// Main request handler
// ---------------------------------------------------------------------

/**
 * By the time this runs, register_rest_route()'s `args` schema has already
 * rejected missing/empty/oversized/malformed fields with a 400
 * rest_invalid_param response — the existing Next.js rest-client.ts only
 * inspects response.ok before parsing JSON, so WordPress's native error
 * shape here does not need to match the frontend's success schema. See
 * contract §5 in docs/contact-form-wordpress-endpoint.md.
 *
 * @param WP_REST_Request $request
 * @return WP_REST_Response|WP_Error
 */
function tff_headless_leads_handle_submission( WP_REST_Request $request ) {
	$lead = array(
		'name'             => $request->get_param( 'name' ),
		'email'            => $request->get_param( 'email' ),
		'phone'            => (string) $request->get_param( 'phone' ),
		'company'          => (string) $request->get_param( 'company' ),
		'service_interest' => $request->get_param( 'service_interest' ),
		'budget'           => $request->get_param( 'budget' ),
		'message'          => $request->get_param( 'message' ),
		'source'           => $request->get_param( 'source' ) ? $request->get_param( 'source' ) : 'website',
	);

	$result = tff_headless_leads_persist( $lead );

	if ( is_wp_error( $result ) ) {
		// Log the real cause server-side; never expose internal WordPress
		// detail (DB errors, file paths, stack traces) to the client.
		error_log( '[tff-headless-leads] ' . $result->get_error_message() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log

		return new WP_Error(
			'tff_lead_storage_failed',
			'Could not save your message. Please try again shortly.',
			array( 'status' => 500 )
		);
	}

	return new WP_REST_Response(
		array(
			'id'     => $result,
			'status' => 'success',
		),
		201
	);
}

// ---------------------------------------------------------------------
// Persistence — dispatches to whichever method the site owner configured.
// Returns the lead's numeric id (int, use 0 if the chosen method has no
// natural id) on success, or a WP_Error on failure. Never throws.
// ---------------------------------------------------------------------

function tff_headless_leads_persist( array $lead ) {
	$method = defined( 'TFF_LEAD_STORAGE_METHOD' ) ? TFF_LEAD_STORAGE_METHOD : '';

	switch ( $method ) {
		case 'cpt':
			return tff_headless_leads_persist_as_cpt( $lead );
		case 'email':
			return tff_headless_leads_persist_as_email( $lead );
		default:
			return new WP_Error(
				'tff_lead_storage_not_configured',
				'TFF_LEAD_STORAGE_METHOD is not set to "cpt" or "email" in wp-config.php. See docs/wordpress-contact-form-installation.md.'
			);
	}
}

// --- Option A: WordPress custom post type -----------------------------

/**
 * Registered only when TFF_LEAD_STORAGE_METHOD is 'cpt', so sites that
 * choose email-only storage don't get an unused post type cluttering
 * their install. Intentionally private/non-public: leads are internal
 * records, not content to expose via WPGraphQL or the REST wp/v2 routes.
 */
add_action( 'init', function () {
	if ( ! defined( 'TFF_LEAD_STORAGE_METHOD' ) || TFF_LEAD_STORAGE_METHOD !== 'cpt' ) {
		return;
	}

	register_post_type(
		TFF_HEADLESS_LEADS_CPT,
		array(
			'label'        => 'Leads',
			'public'       => false,
			'show_ui'      => true, // visible under a top-level admin menu so leads can actually be read
			'show_in_menu' => true,
			'menu_icon'    => 'dashicons-email-alt',
			'supports'     => array( 'title' ),
			'show_in_rest' => false,
			'capability_type' => 'post',
		)
	);
	// No register_activation_hook/flush_rewrite_rules needed: 'public' is
	// false, so this CPT never registers custom permalink rewrite rules.
} );

/**
 * Admin-only display of the submitted lead data. The CPT only supports
 * 'title' (see register_post_type() above), so without this metabox the
 * edit screen shows nothing but "Name — Email". Read-only: this plugin's
 * job is to record submissions accurately, not let admins edit them.
 */
add_action( 'add_meta_boxes', function () {
	add_meta_box(
		'tff_lead_details',
		'Lead Details',
		'tff_headless_leads_render_details_metabox',
		TFF_HEADLESS_LEADS_CPT,
		'normal',
		'high'
	);
} );

function tff_headless_leads_render_details_metabox( WP_Post $post ) {
	// The title is stored as "{name} — {email}" by
	// tff_headless_leads_persist_as_cpt(); split it back out here rather
	// than storing name separately, to avoid duplicating data.
	$title_parts = explode( ' — ', $post->post_title, 2 );
	$name        = $title_parts[0] !== '' ? $title_parts[0] : $post->post_title;

	$email   = get_post_meta( $post->ID, 'lead_email', true );
	$phone   = get_post_meta( $post->ID, 'lead_phone', true );
	$company = get_post_meta( $post->ID, 'lead_company', true );
	$service = get_post_meta( $post->ID, 'lead_service', true );
	$budget  = get_post_meta( $post->ID, 'lead_budget', true );
	$message = get_post_meta( $post->ID, 'lead_message', true );
	$source  = get_post_meta( $post->ID, 'lead_source', true );

	$rows = array(
		'Name'             => $name,
		'Email'            => $email,
		'Phone'            => $phone,
		'Company'          => $company,
		'Service Interest' => $service,
		'Budget'           => $budget,
		'Source'           => $source,
		'Submitted'        => get_the_date( 'F j, Y g:i a', $post ),
	);
	?>
	<table class="widefat striped" style="border:none;">
		<tbody>
			<?php foreach ( $rows as $label => $value ) : ?>
				<tr>
					<th style="width:160px; text-align:left; vertical-align:top;"><?php echo esc_html( $label ); ?></th>
					<td>
						<?php if ( $label === 'Email' && $value ) : ?>
							<a href="<?php echo esc_url( 'mailto:' . $value ); ?>"><?php echo esc_html( $value ); ?></a>
						<?php else : ?>
							<?php echo $value !== '' ? esc_html( $value ) : '<em>Not provided</em>'; ?>
						<?php endif; ?>
					</td>
				</tr>
			<?php endforeach; ?>
			<tr>
				<th style="width:160px; text-align:left; vertical-align:top;">Message</th>
				<td><?php echo $message !== '' ? nl2br( esc_html( $message ) ) : '<em>Not provided</em>'; ?></td>
			</tr>
		</tbody>
	</table>
	<?php
}

function tff_headless_leads_persist_as_cpt( array $lead ) {
	$post_id = wp_insert_post(
		array(
			'post_type'   => TFF_HEADLESS_LEADS_CPT,
			'post_status' => 'private',
			'post_title'  => sprintf( '%s — %s', $lead['name'], $lead['email'] ),
			'meta_input'  => array(
				'lead_email'   => $lead['email'],
				'lead_phone'   => $lead['phone'],
				'lead_company' => $lead['company'],
				'lead_service' => $lead['service_interest'],
				'lead_budget'  => $lead['budget'],
				'lead_message' => $lead['message'],
				'lead_source'  => $lead['source'],
			),
		),
		true // return WP_Error on failure instead of 0
	);

	if ( is_wp_error( $post_id ) ) {
		return $post_id;
	}

	return $post_id;
}

// --- Option B: email notification only ---------------------------------

function tff_headless_leads_persist_as_email( array $lead ) {
	$to      = get_option( 'admin_email' );
	$subject = sprintf( 'New website lead: %s', $lead['name'] );
	$body    = sprintf(
		"Name: %s\nEmail: %s\nPhone: %s\nCompany: %s\nService interest: %s\nBudget: %s\nSource: %s\n\nMessage:\n%s",
		$lead['name'],
		$lead['email'],
		$lead['phone'],
		$lead['company'],
		$lead['service_interest'],
		$lead['budget'],
		$lead['source'],
		$lead['message']
	);
	$headers = array( 'Reply-To: ' . $lead['name'] . ' <' . $lead['email'] . '>' );

	$sent = wp_mail( $to, $subject, $body, $headers );

	if ( ! $sent ) {
		return new WP_Error( 'tff_lead_email_failed', 'wp_mail() returned false — check server mail configuration.' );
	}

	// No natural numeric id for an email-only submission; 0 is valid per
	// the frontend contract (WPLeadResponse.id is always a number).
	return 0;
}

// ---------------------------------------------------------------------
// Headless hardening — keep this CMS domain out of search engines.
// ---------------------------------------------------------------------

/**
 * This WordPress install is a headless backend: the same content is served
 * to the public at https://www.tffdigital.com, which must remain the only
 * indexed copy. Before this module, Google was free to index
 * cms.tffdigital.com — the robots meta said "index, follow", every page
 * self-canonicalized to the cms domain, and robots.txt advertised a full
 * Yoast sitemap (audited live 2026-09-01).
 *
 * Strategy — three layers, with robots.txt deliberately left permissive:
 * a crawler that is blocked from crawling can never SEE a noindex, so
 * Disallow rules would strand any already-indexed URL in the index.
 *
 *   1. `X-Robots-Tag: noindex, nofollow` on every WP-rendered response —
 *      the authoritative, markup-independent signal. REST (/wp-json) and
 *      WPGraphQL (/graphql) already send their own noindex header on a
 *      code path that bypasses `send_headers`, so they need nothing here.
 *      Media under /wp-content/uploads is served by Apache without PHP
 *      and therefore needs an .htaccess rule instead (manual step,
 *      documented in the repo).
 *   2. The same directives forced into the robots meta tag for WordPress's
 *      own rendered front-end pages. Yoast feeds its directives through WP
 *      core's wp_robots API, so one late wp_robots filter overrides both
 *      core and Yoast output; the wpseo_robots filter covers Yoast's
 *      legacy string path as belt and braces. Both filters exempt REST
 *      (/wp-json) and WPGraphQL (/graphql) requests: Yoast computes this
 *      same "effective robots" value for yoast_head_json and for the
 *      WPGraphQL SEO field, and the headless Next.js frontend depends on
 *      that value reflecting each post's real per-post Yoast setting —
 *      not this CMS-domain-only override. (Fixed in v1.5.0 — the original
 *      unconditional version silently forced every post's indexable/
 *      followable fields to noindex/nofollow over both APIs regardless of
 *      its actual Yoast setting, confirmed live 2026-09-02 on all 10 real
 *      content pieces.)
 *   3. XML sitemaps switched off (Yoast + core) so the site stops
 *      handing crawlers an index-me list; with its sitemaps disabled,
 *      Yoast also stops printing the "Sitemap:" line into robots.txt.
 *
 * None of this affects the Next.js frontend or admin use: robots signals
 * instruct search-engine indexers only — they never block HTTP
 * consumption, so Vercel's GraphQL/REST/media fetches, wp-admin, and
 * authenticated workflows are untouched. The v1.5.0 REST/GraphQL
 * exemption above is what makes "untouched" true for the SEO *data* those
 * fetches return, not just the HTTP layer — REST and GraphQL keep their
 * own independent noindex X-Robots-Tag header either way (see layer 1),
 * so this exemption cannot make either API endpoint itself indexable. Do
 * NOT additionally enable Settings → Reading → "Discourage search
 * engines": it would add a robots.txt Disallow that hides these noindex
 * signals from crawlers.
 */

add_action( 'send_headers', function () {
	header( 'X-Robots-Tag: noindex, nofollow', true );
} );

add_filter( 'wp_robots', function ( array $robots ) {
	// REST (/wp-json) and WPGraphQL (/graphql) already carry their own
	// noindex X-Robots-Tag header independent of this plugin (WP core and
	// WPGraphQL both add it natively — verified live) — so it's safe, and
	// necessary, to let Yoast's real per-post value pass through here
	// instead of forcing noindex/nofollow into the SEO data those APIs
	// hand to the headless Next.js frontend. That frontend needs the true
	// per-post setting to correctly render index/follow on the public
	// https://www.tffdigital.com page; this override must stay scoped to
	// WordPress's own rendered HTML only.
	if (
		( defined( 'REST_REQUEST' ) && REST_REQUEST ) ||
		( defined( 'GRAPHQL_REQUEST' ) && GRAPHQL_REQUEST )
	) {
		return $robots;
	}

	// Drop any index/follow a plugin (Yoast included) already added, then
	// assert the opposite; unrelated directives (max-image-preview etc.)
	// are harmless alongside noindex and left alone.
	unset( $robots['index'], $robots['follow'] );
	$robots['noindex']  = true;
	$robots['nofollow'] = true;
	return $robots;
}, 999 );

// Yoast's legacy front-end robots string — a no-op on Yoast versions that
// render exclusively through wp_robots (the filter above already won).
// Same REST/GraphQL exemption as wp_robots above, for the same reason.
add_filter( 'wpseo_robots', function ( $robots ) {
	if (
		( defined( 'REST_REQUEST' ) && REST_REQUEST ) ||
		( defined( 'GRAPHQL_REQUEST' ) && GRAPHQL_REQUEST )
	) {
		return $robots;
	}

	return 'noindex, nofollow';
}, 999 );

// Yoast XML sitemaps (/sitemap_index.xml and children) ...
add_filter( 'wpseo_enable_xml_sitemap', '__return_false' );
// ... and WP core's fallback /wp-sitemap.xml, for completeness.
add_filter( 'wp_sitemaps_enabled', '__return_false' );

// ---------------------------------------------------------------------
// Headless View + Preview — redirect supported content types to the
// Next.js frontend instead of this CMS.
// ---------------------------------------------------------------------

/**
 * The Next.js frontend origin, shared by every headless URL rewrite below.
 * One definition, reused, rather than repeating the same fallback in each
 * filter — see the class-level doc comment for the optional wp-config.php
 * override.
 */
function tff_headless_frontend_url() {
	return defined( 'TFF_HEADLESS_FRONTEND_URL' ) && '' !== TFF_HEADLESS_FRONTEND_URL
		? rtrim( TFF_HEADLESS_FRONTEND_URL, '/' )
		: 'https://www.tffdigital.com';
}

/**
 * Every WordPress post type with a real, working Next.js detail page —
 * verified against the actual App Router source before being added here,
 * not assumed. post_type => frontend URL path segment.
 *
 * Deliberately excludes types with no live frontend route to render them:
 * projects, testimonial, team, and faq have no repository/service/GraphQL
 * query/route anywhere in the Next.js app (testimonials and team are
 * local static data; faq is a hardcoded array) — nothing to redirect to.
 * `page` has a dormant, unused content-page data layer with zero routes.
 * Redirecting any of these would send an editor's "View" click at a URL
 * that can only 404.
 */
function tff_headless_route_map() {
	return array(
		'case-study' => 'case-studies',
		'service'    => 'services',
		'post'       => 'blog',
	);
}

/**
 * Subset of tff_headless_route_map() that ALSO has a working Next.js
 * preview-fetch path (an authenticated asPreview GraphQL query + a
 * draftMode()-aware page — see src/app/api/preview/<slug>/route.ts and the
 * corresponding [slug]/page.tsx). post_type => /api/preview/<slug> segment.
 *
 * `post` (standard blog posts) is intentionally NOT included: no preview
 * query/repository/service function exists yet for post.service.ts, and
 * building one is real, unreviewed new work — reported as a follow-up
 * rather than wired up as an unsafe shortcut. Blog posts still get their
 * View link fixed below; Preview keeps WordPress's original CMS-domain
 * behavior until that Next.js work exists (see the status-gate note on
 * tff_headless_permalink_filter — this is what makes that fallback safe).
 */
function tff_headless_preview_route_map() {
	return array(
		'case-study' => 'case-study',
		'service'    => 'service',
	);
}

/**
 * WordPress's native "Preview" (and, on an already-published post,
 * "Preview changes") button calls get_preview_post_link(), which by
 * default builds a URL on THIS site using the post type's own permalink —
 * the incomplete/incorrect CMS-domain rendering originally reported for
 * Case Studies. This filter overrides that URL for every post type listed
 * in tff_headless_preview_route_map(), pointing instead at the matching
 * Next.js preview endpoint (src/app/api/preview/<type>/route.ts), which
 * authenticates the request, enables Next.js Draft Mode, and redirects to
 * the real frontend detail page.
 *
 * Only $post->ID and TFF_HEADLESS_PREVIEW_SECRET cross this boundary — no
 * post content, no WordPress credentials. The Next.js route is what
 * actually authenticates back into WordPress (via a separate Application
 * Password, configured only in Vercel) to fetch the draft content, so
 * nothing here weakens WordPress's own authentication.
 *
 * Note: get_preview_post_link() internally calls get_permalink() to build
 * its base URL, which also passes through tff_headless_permalink_filter()
 * below — but for any post type handled in THIS filter, that base URL is
 * discarded entirely and a fresh one built from scratch, so the permalink
 * filter's output never matters here. It only matters for post types NOT
 * in the preview map (e.g. blog posts) — see that filter's own comment.
 */
add_filter( 'preview_post_link', function ( $preview_link, $post ) {
	if ( ! $post instanceof WP_Post ) {
		return $preview_link;
	}

	$preview_map = tff_headless_preview_route_map();
	if ( ! isset( $preview_map[ $post->post_type ] ) ) {
		return $preview_link;
	}

	if ( ! defined( 'TFF_HEADLESS_PREVIEW_SECRET' ) || '' === TFF_HEADLESS_PREVIEW_SECRET ) {
		// Not configured yet — leave WordPress's default preview link alone
		// rather than redirecting the editor somewhere broken.
		return $preview_link;
	}

	return add_query_arg(
		array(
			'secret' => rawurlencode( TFF_HEADLESS_PREVIEW_SECRET ),
			'id'     => $post->ID,
		),
		tff_headless_frontend_url() . '/api/preview/' . $preview_map[ $post->post_type ]
	);
}, 10, 2 );

/**
 * Published permalink — point "View" (and every other internal use of
 * get_permalink()/get_post_permalink() for a supported post type: the REST
 * API's own `link` field, Yoast's default canonical, etc.) at the real
 * public page instead of this CMS domain, which has no visitor-facing
 * template worth linking to for a headless content type.
 *
 * WordPress core uses TWO different filters here depending on the post
 * type, which is why this one callback is registered on both hooks below:
 *   - post_type_link — applied by get_post_permalink(), which
 *     get_permalink() delegates to for any non-builtin CPT (case-study,
 *     service). 4 args upstream (link, post, leavename, sample); this
 *     callback only needs the first two.
 *   - post_link — applied directly inside get_permalink() for the
 *     built-in `post` type (standard blog posts) — a separate code path,
 *     confirmed from WordPress core, that post_type_link never touches.
 * (`page` uses a third filter, page_link, via get_page_link() — not
 * registered here at all, since Pages have no live frontend route.)
 *
 * Only rewrites when $post->post_status is 'publish': an unpublished
 * post's "public" URL doesn't really exist yet, so leaving get_permalink()
 * at its original CMS-domain output for anything else is more correct —
 * and for post types with no Preview support (see
 * tff_headless_preview_route_map(), currently just `post`),
 * get_preview_post_link()'s internal get_permalink() call relies on
 * exactly that original, unrewritten output as its preview base URL. This
 * status gate is what keeps blog-post Preview safely on its existing
 * WordPress behavior without this filter having to know anything about
 * preview mechanics itself.
 */
function tff_headless_permalink_filter( $post_link, $post ) {
	if ( ! $post instanceof WP_Post ) {
		return $post_link;
	}

	$route_map = tff_headless_route_map();
	if ( ! isset( $route_map[ $post->post_type ] ) ) {
		return $post_link;
	}

	if ( 'publish' !== $post->post_status ) {
		return $post_link;
	}

	return tff_headless_frontend_url() . '/' . $route_map[ $post->post_type ] . '/' . $post->post_name;
}
add_filter( 'post_type_link', 'tff_headless_permalink_filter', 10, 2 );
add_filter( 'post_link', 'tff_headless_permalink_filter', 10, 2 );

// ---------------------------------------------------------------------
// On-demand revalidation webhook → Next.js (tff-digital audit CACHE-1)
// ---------------------------------------------------------------------

/**
 * Tells the Next.js frontend that one entry of a post type with a live
 * route (tff_headless_route_map()) changed publicly, so it can refresh the
 * cached pages that render it (the entry's own page, its listing, the
 * homepage surfaces, the sitemap) without waiting for the 30s ISR window.
 *
 * Only the post type, the public slug and the event name cross this
 * boundary — no content, no credentials. The frontend authenticates the
 * call with the shared secret (constant-time compare), validates the
 * payload, and refuses to invalidate anything while WordPress itself is
 * unreachable from its side, so a save during an outage can never turn a
 * healthy cached page into an error page. A failed or rejected call is
 * logged and otherwise ignored: the frontend's time-based refresh remains
 * the safety net, exactly as before this hook existed.
 *
 * Blocking with a short timeout rather than a non-blocking request so a
 * failure is visible in the PHP error log; the editor's save waits at most
 * TFF_HEADLESS_REVALIDATE_TIMEOUT seconds.
 */
define( 'TFF_HEADLESS_REVALIDATE_TIMEOUT', 5 );

function tff_headless_revalidate( WP_Post $post, $event ) {
	if ( ! defined( 'TFF_HEADLESS_REVALIDATE_SECRET' ) || '' === TFF_HEADLESS_REVALIDATE_SECRET ) {
		return; // Feature not configured — keep time-based ISR only.
	}

	$route_map = tff_headless_route_map();
	if ( ! isset( $route_map[ $post->post_type ] ) ) {
		return; // No live frontend route for this post type.
	}

	// Trashing appends "__trashed" to post_name; the public URL never had it.
	$slug = preg_replace( '/__trashed$/', '', (string) $post->post_name );
	if ( '' === $slug ) {
		return; // auto-draft / not yet slugged: nothing public to refresh.
	}

	$response = wp_remote_post(
		tff_headless_frontend_url() . '/api/revalidate',
		array(
			'timeout' => TFF_HEADLESS_REVALIDATE_TIMEOUT,
			'headers' => array(
				'Authorization' => 'Bearer ' . TFF_HEADLESS_REVALIDATE_SECRET,
				'Content-Type'  => 'application/json',
			),
			'body'    => wp_json_encode(
				array(
					'type'  => $post->post_type,
					'slug'  => $slug,
					'event' => $event,
				)
			),
		)
	);

	if ( is_wp_error( $response ) ) {
		error_log( sprintf( '[tff-headless] revalidate %s/%s (%s) failed: %s', $post->post_type, $slug, $event, $response->get_error_message() ) );
		return;
	}

	$code = (int) wp_remote_retrieve_response_code( $response );
	if ( 200 !== $code ) {
		// 401 = secret mismatch, 503 = frontend not configured or CMS
		// unreachable from the frontend (it deliberately refreshed nothing).
		error_log( sprintf( '[tff-headless] revalidate %s/%s (%s) returned HTTP %d', $post->post_type, $slug, $event, $code ) );
	}
}

/**
 * Every transition that changes what the public sees: into or out of
 * "publish" (publish, unpublish, trash, restore) and a save of an already
 * published entry (publish → publish). Draft-to-draft edits are ignored —
 * nothing public changed. Revisions/autosaves never carry a mapped post
 * type, so they fall out at the route-map check.
 */
add_action( 'transition_post_status', function ( $new_status, $old_status, $post ) {
	if ( ! $post instanceof WP_Post ) {
		return;
	}
	if ( 'publish' !== $new_status && 'publish' !== $old_status ) {
		return;
	}
	if ( 'publish' === $new_status && 'publish' === $old_status ) {
		$event = 'update';
	} elseif ( 'publish' === $new_status ) {
		$event = 'publish';
	} elseif ( 'trash' === $new_status ) {
		$event = 'trash';
	} else {
		$event = 'unpublish';
	}
	tff_headless_revalidate( $post, $event );
}, 10, 3 );

/**
 * Permanent deletion (emptying the trash, or deleting outright). The entry
 * was already refreshed away when it was trashed/unpublished; this covers
 * a direct delete of a published entry.
 */
add_action( 'deleted_post', function ( $post_id, $post ) {
	if ( $post instanceof WP_Post ) {
		tff_headless_revalidate( $post, 'delete' );
	}
}, 10, 2 );
