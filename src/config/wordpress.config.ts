const graphqlEndpoint = process.env.WORDPRESS_GRAPHQL_ENDPOINT ?? "";
const restUrl = process.env.WORDPRESS_REST_URL ?? "";

export const wordpressConfig = {
  graphqlEndpoint,
  restUrl,
  mediaHostname: process.env.WORDPRESS_MEDIA_HOSTNAME ?? "",
  useMockData:
    process.env.WORDPRESS_USE_MOCK_DATA === "true" || graphqlEndpoint === "",
} as const;
