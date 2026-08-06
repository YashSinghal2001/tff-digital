import "server-only";
import { wordpressConfig } from "@/config/wordpress.config";
import { WordPressError } from "@/lib/wordpress/errors";

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
    });
  } catch (cause) {
    throw new WordPressError(
      `Could not reach WordPress REST API at ${wordpressConfig.restUrl}${path}: ${
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
