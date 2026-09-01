import "server-only";
import { wordpressConfig } from "@/config/wordpress.config";
import { WordPressError } from "@/lib/wordpress/errors";

// Same ceiling as the GraphQL client (src/lib/wordpress/client.ts): a hanging
// CMS must fail the contact-form Server Action into its friendly error state,
// not leave the visitor's submit spinner running until the platform gives up.
const REQUEST_TIMEOUT_MS = 8_000;

export async function postToWordPress<TResponse, TBody = unknown>(
  path: string,
  body: TBody,
): Promise<TResponse> {
  if (!wordpressConfig.restUrl) {
    throw new WordPressError(
      "WORDPRESS_REST_URL is not configured. Set it in your environment.",
      "config",
    );
  }

  let response: Response;
  try {
    response = await fetch(`${wordpressConfig.restUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    const timedOut = cause instanceof Error && cause.name === "TimeoutError";
    throw new WordPressError(
      timedOut
        ? `WordPress REST request timed out after ${REQUEST_TIMEOUT_MS}ms (${path})`
        : `Could not reach WordPress REST API at ${wordpressConfig.restUrl}${path}: ${
            cause instanceof Error ? cause.message : String(cause)
          }`,
      "network",
    );
  }

  if (!response.ok) {
    throw new WordPressError(
      `WordPress REST request failed with status ${response.status}`,
      "http",
    );
  }

  try {
    return (await response.json()) as TResponse;
  } catch {
    throw new WordPressError("WordPress REST API returned a non-JSON response", "parse");
  }
}
