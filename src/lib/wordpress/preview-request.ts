import "server-only";
import { previewConfig } from "@/config/preview.config";
import { secretsMatch } from "@/lib/wordpress/secret-compare";

/**
 * Shared by every /api/preview/<type> route (see case-study/route.ts,
 * service/route.ts). The constant-time compare itself lives in
 * secret-compare.ts, shared with the revalidation webhook (audit CACHE-1),
 * so the security-critical comparison exists in exactly one place.
 */
export function isValidPreviewSecret(secret: string | null): boolean {
  return secretsMatch(previewConfig.secret, secret);
}

/** Parses the `id` query param every preview route receives from WordPress
 *  into a positive integer, or null if missing/invalid. */
export function parsePreviewId(idParam: string | null): number | null {
  const id = idParam ? Number(idParam) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}
