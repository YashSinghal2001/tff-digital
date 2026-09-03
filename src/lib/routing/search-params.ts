/**
 * A single searchParams value as Next.js actually delivers it. A repeated key
 * (`?q=a&q=b`) arrives as an array, not a string — so any route that types a
 * key as a plain `string` is describing a shape Next never guaranteed.
 */
export type SearchParamValue = string | string[] | undefined;

/**
 * Normalizes a searchParams value to its first entry.
 *
 * Route code that assumed a plain string crashed on `.trim()` — or passed an
 * array straight into a GraphQL String variable — producing an uncaught 500 on
 * live, indexable routes (SMOKE-2, Phase 5). A duplicated key is something a
 * browser extension, a malformed shared link, or a hand-edited URL produces by
 * accident, so the useful response is the page the visitor asked for, not an
 * error: taking the first value renders exactly what a single-valued key would.
 */
export function firstSearchParam(value: SearchParamValue): string | undefined {
  if (!Array.isArray(value)) return value;
  return value.length > 0 ? value[0] : undefined;
}
