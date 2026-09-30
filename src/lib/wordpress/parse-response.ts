import { z } from "zod";
// Relative import (not @/) so this module and its tests load under
// `node --test`, which resolves real ESM paths only — same reasoning as
// the .ts-extension imports in src/schemas/api/*.schema.ts.
import { WordPressError } from "./errors.ts";

/**
 * Validates a WordPress response (GraphQL or REST) against its expected
 * shape before it enters the application (audit CQ-1; the REST lead
 * response joined via audit FORM-RT-1). Until now every response was
 * trusted via a bare `as` cast, so a malformed response — a WPGraphQL
 * schema change, a plugin update, a renamed field — surfaced as `undefined`
 * propagation or a stray TypeError deep in a component. This turns it into
 * the same typed WordPressError every other WordPress failure mode already
 * produces, at the fetch boundary, where the existing strict/soft handling
 * in the services applies to it unchanged.
 *
 * The error message carries only issue paths and codes — never response
 * content — and a ZodError is never allowed to escape (a raw ZodError
 * would be misread as a form-input failure by the contact action's
 * `instanceof ZodError` branch).
 */
export function parseWordPressResponse<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown,
  queryLabel: string,
): z.output<TSchema> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const issues = result.error.issues
    .map((issue) => `${issue.path.join(".") || "<root>"}: ${issue.code}`)
    .join("; ");

  throw new WordPressError(
    `WordPress response for ${queryLabel} did not match the expected shape (${issues})`,
    "parse",
  );
}

/**
 * Per-record counterpart of parseWordPressResponse for collection nodes
 * (2026-09 spam incident): each node is validated on its own against the
 * strict schema, invalid ones are dropped, and only an aggregate count plus
 * the distinct issue paths/codes are logged — never node content. One
 * malformed CMS record (e.g. an injected post with `modified: null`) can no
 * longer take down a whole listing, and it can never be rendered either.
 */
export function keepValidWordPressNodes<TSchema extends z.ZodType>(
  schema: TSchema,
  nodes: unknown[],
  queryLabel: string,
): z.output<TSchema>[] {
  const valid: z.output<TSchema>[] = [];
  const issues = new Set<string>();
  for (const node of nodes) {
    const result = schema.safeParse(node);
    if (result.success) valid.push(result.data);
    else
      for (const issue of result.error.issues)
        issues.add(`${issue.path.join(".") || "<root>"}: ${issue.code}`);
  }
  const rejected = nodes.length - valid.length;
  if (rejected > 0) {
    console.warn(
      `[${queryLabel}] Rejected ${rejected} of ${nodes.length} invalid WordPress records (${[...issues].slice(0, 5).join("; ")})`,
    );
  }
  return valid;
}
