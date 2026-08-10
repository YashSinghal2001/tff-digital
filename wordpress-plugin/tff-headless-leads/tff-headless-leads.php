<?php
/**
 * Plugin Name:       TFF Headless Leads API
 * Description:       Public REST endpoint (POST /wp-json/headless/v1/leads) that accepts contact-form submissions from the Next.js frontend. See docs/contact-form-wordpress-endpoint.md and docs/wordpress-contact-form-installation.md in the tff-digital repository for the full contract.
 * Version:           1.0.0
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
