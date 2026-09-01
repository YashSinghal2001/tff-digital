import "server-only";
import { wordpressConfig } from "@/config/wordpress.config";
import { WordPressError } from "@/lib/wordpress/errors";

interface GraphQLError {
  message: string;
}

interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLError[];
}

export interface FetchGraphQLOptions {
  cache?: RequestCache;
  next?: NextFetchRequestConfig;
}

// Hard ceiling on every WPGraphQL round-trip. Healthy queries answer in well
// under 1s; without a bound, a hanging CMS held requests open indefinitely
// (observed live 2026-09: cold hits ran 12s+ until the platform killed the
// function). 8s stays inside Vercel's default function budget so the error
// path — caught fallbacks or the route's error boundary — always runs.
const REQUEST_TIMEOUT_MS = 8_000;

export async function fetchGraphQL<TData>(
  query: string,
  variables?: Record<string, unknown>,
  options?: FetchGraphQLOptions,
): Promise<TData> {
  if (!wordpressConfig.graphqlEndpoint) {
    throw new WordPressError(
      "WORDPRESS_GRAPHQL_ENDPOINT is not configured. Set it in your environment or enable WORDPRESS_USE_MOCK_DATA.",
      "config",
    );
  }

  // No caller currently passes `cache` or `next`, so this default applies
  // globally: uncached WordPress fetches become ISR (revalidate every 60s)
  // instead of Next.js's implicit permanent static cache. An explicit
  // `cache` always wins and is never combined with `next.revalidate`,
  // since fetch() rejects requests that set both.
  const cacheOption = options?.cache;
  const nextOption = cacheOption
    ? undefined
    : (options?.next ?? { revalidate: 60 });

  let response: Response;
  try {
    response = await fetch(wordpressConfig.graphqlEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables }),
      cache: cacheOption,
      next: nextOption,
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    // AbortSignal.timeout rejects with a DOMException named "TimeoutError".
    const timedOut = cause instanceof Error && cause.name === "TimeoutError";
    throw new WordPressError(
      timedOut
        ? `WPGraphQL request timed out after ${REQUEST_TIMEOUT_MS}ms (${wordpressConfig.graphqlEndpoint})`
        : `Could not reach WPGraphQL at ${wordpressConfig.graphqlEndpoint}: ${
            cause instanceof Error ? cause.message : String(cause)
          }`,
      "network",
    );
  }

  if (!response.ok) {
    throw new WordPressError(
      `WPGraphQL request failed with status ${response.status}`,
      "http",
    );
  }

  let json: GraphQLResponse<TData>;
  try {
    json = (await response.json()) as GraphQLResponse<TData>;
  } catch {
    throw new WordPressError("WPGraphQL returned a non-JSON response", "parse");
  }

  if (json.errors && json.errors.length > 0) {
    throw new WordPressError(
      `WPGraphQL returned errors: ${json.errors.map((error) => error.message).join("; ")}`,
      "graphql",
    );
  }

  if (!json.data) {
    throw new WordPressError("WPGraphQL response did not include a data field", "parse");
  }

  return json.data;
}
