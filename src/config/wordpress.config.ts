const graphqlEndpoint = process.env.WORDPRESS_GRAPHQL_ENDPOINT ?? "";
const restUrl = process.env.WORDPRESS_REST_URL ?? "";

export const wordpressConfig = {
  graphqlEndpoint,
  restUrl,
  mediaHostname: process.env.WORDPRESS_MEDIA_HOSTNAME ?? "",
  // PRODUCTION-SAFETY GUARD (ARCH-3): mock WordPress data is a development /
  // missing-endpoint fallback, and BOTH arms of this OR are silent. The
  // literal string "true" wins even when a real GraphQL endpoint is
  // configured, and an empty/unset endpoint forces mock mode too — either
  // way every service quietly serves src/lib/mock/* content with no error
  // surfaced anywhere. Nothing in code enforces the production expectation;
  // it is deployment configuration: in Vercel Production this variable must
  // stay unset (or "false") and WORDPRESS_GRAPHQL_ENDPOINT must be set, or
  // the live site serves mock content while looking healthy.
  useMockData:
    process.env.WORDPRESS_USE_MOCK_DATA === "true" || graphqlEndpoint === "",
} as const;
