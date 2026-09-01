import "server-only";
import { WordPressError } from "@/lib/wordpress/errors";

/**
 * Draft/unsaved-revision content is invisible to unauthenticated WPGraphQL
 * requests by WordPress's own core visibility rules (the same guarantee
 * that already keeps every public query in this app from ever seeing
 * unpublished content). The preview flow's one authenticated exception
 * uses a WordPress Application Password — WP core (5.6+), no auth plugin
 * required — sent as HTTP Basic Auth, exactly like a normal WP REST API
 * client. This credential is read only here, only server-side, and is
 * never sent to or reachable from the browser.
 */
export function buildPreviewAuthHeaders(): Record<string, string> {
  const username = process.env.WORDPRESS_PREVIEW_USERNAME ?? "";
  const appPassword = process.env.WORDPRESS_PREVIEW_APP_PASSWORD ?? "";

  if (!username || !appPassword) {
    throw new WordPressError(
      "WORDPRESS_PREVIEW_USERNAME / WORDPRESS_PREVIEW_APP_PASSWORD are not configured.",
      "config",
    );
  }

  const encoded = Buffer.from(`${username}:${appPassword}`).toString("base64");
  return { Authorization: `Basic ${encoded}` };
}
