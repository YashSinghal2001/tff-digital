export const previewConfig = {
  // Shared secret WordPress appends to the preview redirect URL (see
  // wordpress-plugin/tff-headless-leads/tff-headless-leads.php's
  // preview_post_link filter). Gatekeeps who can trigger draft mode; the
  // actual draft CONTENT is protected separately by WordPress authentication
  // (see src/lib/wordpress/preview-auth.ts) — this secret alone never
  // exposes any content.
  secret: process.env.WORDPRESS_PREVIEW_SECRET ?? "",
} as const;
