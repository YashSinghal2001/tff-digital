import { z } from "zod";

// Body of the WordPress → Next.js revalidation webhook (audit CACHE-1),
// sent by wordpress-plugin/tff-headless-leads on publish/update/unpublish/
// trash/delete of a content type with a live frontend route. Only what the
// route needs to name paths crosses this boundary: the content type and
// its slug (post_name). Anything else is stripped (Zod default).

/** WordPress post types with a live Next.js route (mirrors the plugin's
 *  tff_headless_route_map()). */
export const REVALIDATE_CONTENT_TYPES = [
  "service",
  "case-study",
  "post",
] as const;
export type RevalidateContentType = (typeof REVALIDATE_CONTENT_TYPES)[number];

// A WordPress post_name: URL-safe slug characters only, so a slug can never
// become a path traversal or a wildcard when it is turned into a route path.
const wpSlug = z
  .string()
  .min(1)
  .max(200)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i);

export const revalidateWebhookSchema = z.object({
  type: z.enum(REVALIDATE_CONTENT_TYPES),
  slug: wpSlug,
  // Informational (logged), never used for routing: which WordPress
  // transition fired (e.g. "publish", "trash", "delete").
  event: z.string().max(50).optional(),
});

export type RevalidateWebhookPayload = z.infer<typeof revalidateWebhookSchema>;
