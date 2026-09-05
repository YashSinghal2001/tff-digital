const graphqlEndpoint = process.env.WORDPRESS_GRAPHQL_ENDPOINT ?? "";
const restUrl = process.env.WORDPRESS_REST_URL ?? "";

/**
 * Whether the services serve src/lib/mock content instead of WordPress.
 * Mock data is a development convenience — `WORDPRESS_USE_MOCK_DATA=true`,
 * or simply no endpoint configured yet — and it is honoured ONLY outside a
 * production build (audit ARCH-3). `next build` / `next start` set
 * NODE_ENV=production (the environment model next.config.ts already keys
 * on), so a production or preview deployment can never serve mock content:
 * if the flag is pasted into Vercel or the endpoint goes missing, the site
 * fails loudly with a typed 'config' error at the WordPress boundary
 * (soft surfaces degrade to empty, strict pages hit the error boundary)
 * rather than looking healthy while serving fake content. Pure, so the
 * environment matrix is unit-tested.
 */
export function resolveUseMockData(env: {
  NODE_ENV?: string;
  WORDPRESS_USE_MOCK_DATA?: string;
  WORDPRESS_GRAPHQL_ENDPOINT?: string;
}): boolean {
  const requested =
    env.WORDPRESS_USE_MOCK_DATA === "true" || !env.WORDPRESS_GRAPHQL_ENDPOINT;
  return requested && env.NODE_ENV !== "production";
}

const useMockData = resolveUseMockData(process.env);

if (!useMockData && process.env.NODE_ENV === "production") {
  // Surface the misconfiguration once, in the build/function log, instead of
  // letting it hide behind empty sections (ARCH-3). Never logs any value.
  if (process.env.WORDPRESS_USE_MOCK_DATA === "true") {
    console.error(
      "[wordpress.config] WORDPRESS_USE_MOCK_DATA=true is ignored in production builds; serving live WordPress content only.",
    );
  }
  if (graphqlEndpoint === "") {
    console.error(
      "[wordpress.config] WORDPRESS_GRAPHQL_ENDPOINT is not set in a production build; WordPress requests will fail with a 'config' error and no mock content will be served.",
    );
  }
}

export const wordpressConfig = {
  graphqlEndpoint,
  restUrl,
  mediaHostname: process.env.WORDPRESS_MEDIA_HOSTNAME ?? "",
  useMockData,
} as const;
