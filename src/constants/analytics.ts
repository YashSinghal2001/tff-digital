// Client-provided Google Tag Manager container. Fixed, single-tenant value
// (not derived from anything client-specific to this deploy), so a constant
// matches this repo's convention better than a new env var — see
// src/config/site.config.ts for the pattern env vars here actually follow
// (deploy-specific values with a fallback), which this isn't.
export const GTM_CONTAINER_ID = "GTM-KTSN4NHB";
