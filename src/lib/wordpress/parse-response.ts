import { z } from "zod";
// Relative import (not @/) so this module and its tests load under
// `node --test`, which resolves real ESM paths only — same reasoning as
// the .ts-extension imports in src/schemas/api/*.schema.ts.
import { WordPressError } from "./errors.ts";

/**
 * Validates a WordPress GraphQL response against its expected shape before
 * it enters the application (audit CQ-1). Until now every response was
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
    `WPGraphQL response for ${queryLabel} did not match the expected shape (${issues})`,
    "parse",
  );
}
