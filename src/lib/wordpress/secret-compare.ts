import { timingSafeEqual } from "node:crypto";

/**
 * Constant-time comparison for the shared secrets WordPress presents to this
 * app (preview links, the revalidation webhook). One implementation for
 * every gate, so the security-critical compare cannot drift per route. An
 * unconfigured `expected` or a missing `provided` is false immediately, and
 * a length mismatch returns false rather than letting timingSafeEqual
 * throw, so a wrong-length guess is indistinguishable from a wrong-value
 * one by timing as well.
 */
export function secretsMatch(
  expected: string,
  provided: string | null | undefined,
): boolean {
  if (!expected || !provided) return false;
  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  if (expectedBytes.length !== providedBytes.length) return false;
  return timingSafeEqual(expectedBytes, providedBytes);
}
