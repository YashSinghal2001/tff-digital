// WORDPRESS_REST_URL already resolves to the REST API root (".../wp-json"),
// so paths here must NOT repeat the "/wp-json" prefix — doing so produced
// ".../wp-json/wp-json/headless/v1/leads", which no WordPress
// register_rest_route() call can ever serve.
export const WP_REST_ENDPOINTS = {
  leads: "/headless/v1/leads",
} as const;
