<?php
/**
 * Plugin Name:       TFF Headless Leads API
 * Description:       Public REST endpoint (POST /wp-json/headless/v1/leads) that accepts contact-form submissions from the Next.js frontend, headless hardening that keeps this CMS domain (noindex) out of search engines, and Case Study preview + public permalink redirects to the Next.js frontend. See docs/contact-form-wordpress-endpoint.md and docs/wordpress-contact-form-installation.md in the tff-digital repository for the full contract.
 * Version:           1.3.0
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
 * CASE STUDY PREVIEW REQUIRES ONE SHARED SECRET
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
 * Until TFF_HEADLESS_PREVIEW_SECRET is defined, the Preview button keeps
 * its default WordPress behavior (opens on this CMS domain) rather than
 * redirecting anywhere broken.
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
 *   2. The same directives forced into the robots meta tag. Yoast feeds
 *      its directives through WP core's wp_robots API, so one late
 *      wp_robots filter overrides both core and Yoast output; the
 *      wpseo_robots filter covers Yoast's legacy string path as belt and
 *      braces.
 *   3. XML sitemaps switched off (Yoast + core) so the site stops
 *      handing crawlers an index-me list; with its sitemaps disabled,
 *      Yoast also stops printing the "Sitemap:" line into robots.txt.
 *
 * None of this affects the Next.js frontend or admin use: robots signals
 * instruct search-engine indexers only — they never block HTTP
 * consumption, so Vercel's GraphQL/REST/media fetches, wp-admin, and
 * authenticated workflows are untouched. Do NOT additionally enable
 * Settings → Reading → "Discourage search engines": it would add a
 * robots.txt Disallow that hides these noindex signals from crawlers.
 */

add_action( 'send_headers', function () {
	header( 'X-Robots-Tag: noindex, nofollow', true );
} );

add_filter( 'wp_robots', function ( array $robots ) {
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
add_filter( 'wpseo_robots', function () {
	return 'noindex, nofollow';
}, 999 );

// Yoast XML sitemaps (/sitemap_index.xml and children) ...
add_filter( 'wpseo_enable_xml_sitemap', '__return_false' );
// ... and WP core's fallback /wp-sitemap.xml, for completeness.
add_filter( 'wp_sitemaps_enabled', '__return_false' );

// ---------------------------------------------------------------------
// Case Study preview — redirect to the Next.js frontend, not this CMS.
// ---------------------------------------------------------------------

/**
 * The Next.js frontend origin, shared by every headless URL rewrite below
 * (preview redirect + the public permalink filter that follows it). One
 * definition, reused, rather than repeating the same fallback in each
 * filter — see the class-level doc comment for the optional wp-config.php
 * override.
 */
function tff_headless_frontend_url() {
	return defined( 'TFF_HEADLESS_FRONTEND_URL' ) && '' !== TFF_HEADLESS_FRONTEND_URL
		? rtrim( TFF_HEADLESS_FRONTEND_URL, '/' )
		: 'https://www.tffdigital.com';
}

/**
 * WordPress's native "Preview" (and, on an already-published post,
 * "Preview changes") button calls get_preview_post_link(), which by
 * default builds a URL on THIS site using the case-study CPT's own
 * permalink — the incomplete/incorrect CMS-domain rendering reported by
 * the editor. This filter overrides that URL for Case Studies only,
 * pointing instead at the Next.js frontend's preview endpoint
 * (src/app/api/preview/case-study/route.ts), which authenticates the
 * request, enables Next.js Draft Mode, and redirects to the real
 * /case-studies/[slug] page.
 *
 * Only $post->ID and TFF_HEADLESS_PREVIEW_SECRET cross this boundary —
 * no post content, no WordPress credentials. The Next.js route is what
 * actually authenticates back into WordPress (via a separate Application
 * Password, configured only in Vercel) to fetch the draft content, so
 * nothing here weakens WordPress's own authentication.
 *
 * Note: get_preview_post_link() internally calls get_permalink() to build
 * its base URL, which now also passes through the post_type_link filter
 * below — but this callback discards that input entirely ($preview_link
 * is never read once the case-study branch is entered) and always builds
 * its own URL from scratch, so that filter has no effect on preview.
 */
add_filter( 'preview_post_link', function ( $preview_link, $post ) {
	if ( ! $post instanceof WP_Post || 'case-study' !== $post->post_type ) {
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
		tff_headless_frontend_url() . '/api/preview/case-study'
	);
}, 10, 2 );

/**
 * Published Case Study permalink — point "View" (and every other internal
 * use of get_permalink() for this CPT: the REST API's own `link` field,
 * Yoast's default canonical, etc.) at the real public page instead of this
 * CMS domain, which has no visitor-facing template worth linking to for a
 * headless post type.
 *
 * get_permalink() delegates to get_post_permalink() for any non-builtin
 * post type, which applies this exact filter
 * (apply_filters('post_type_link', $post_link, $post, $leavename, $sample))
 * before returning — that's the single choke point wp-admin's "View" row
 * action, get_permalink() callers elsewhere in WP core, and REST/Yoast all
 * go through, so one filter here covers all of them without touching
 * WPGraphQL (this app's own case-study queries never request a link/uri
 * field, so their responses are unaffected either way) or any other post
 * type — the post_type check below is the only thing that runs for
 * everything else (posts, pages, services, testimonials, FAQs, leads,
 * media), returning $post_link unchanged.
 *
 * Applies regardless of $post->post_status: the public URL for a given
 * slug is a property of the CPT's URL structure, not of any one post's
 * current status, matching how the rest of this rewrite is scoped.
 */
add_filter( 'post_type_link', function ( $post_link, $post ) {
	if ( ! $post instanceof WP_Post || 'case-study' !== $post->post_type ) {
		return $post_link;
	}

	return tff_headless_frontend_url() . '/case-studies/' . $post->post_name;
}, 10, 2 );
