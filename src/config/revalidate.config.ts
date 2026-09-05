export const revalidateConfig = {
  // Shared secret WordPress sends as a Bearer token to POST /api/revalidate
  // (see wordpress-plugin/tff-headless-leads/tff-headless-leads.php's
  // tff_headless_revalidate_* hooks). Unset means the endpoint is disabled
  // and the site keeps its time-based ISR behaviour only (audit CACHE-1).
  // Read per request, not at import, so an unconfigured deployment and a
  // rotation are both observable without a restart — and testable.
  get secret(): string {
    return process.env.WORDPRESS_REVALIDATE_SECRET ?? "";
  },
} as const;
