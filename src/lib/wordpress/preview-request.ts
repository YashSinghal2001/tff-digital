import "server-only";
import { timingSafeEqual } from "node:crypto";
import { previewConfig } from "@/config/preview.config";

/**
 * Shared by every /api/preview/<type> route (see case-study/route.ts,
 * service/route.ts) so the security-critical secret comparison exists in
 * exactly one place rather than one per-content-type copy. Constant-time:
 * returns false immediately on a length mismatch rather than letting
 * timingSafeEqual throw, so a wrong-length guess can't be distinguished
 * from a wrong-value one by timing either.
 */
export function isValidPreviewSecret(secret: string | null): boolean {
  if (!previewConfig.secret || !secret) return false;
  const expected = Buffer.from(previewConfig.secret);
  const actual = Buffer.from(secret);
  if (expected.length !== actual.length) return false;
  return timingSafeEqual(expected, actual);
}

/** Parses the `id` query param every preview route receives from WordPress
 *  into a positive integer, or null if missing/invalid. */
export function parsePreviewId(idParam: string | null): number | null {
  const id = idParam ? Number(idParam) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
}
