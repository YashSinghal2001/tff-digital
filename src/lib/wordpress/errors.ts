export type WordPressErrorKind = "config" | "network" | "http" | "graphql" | "parse";

/**
 * Thrown by the GraphQL/REST clients so callers (services, error.tsx
 * boundaries) can distinguish "WP isn't configured yet" from a real
 * outage or a malformed response, instead of a bare Error.
 */
export class WordPressError extends Error {
  readonly kind: WordPressErrorKind;

  constructor(message: string, kind: WordPressErrorKind) {
    super(message);
    this.name = "WordPressError";
    this.kind = kind;
  }
}

export function isWordPressError(error: unknown): error is WordPressError {
  return error instanceof WordPressError;
}
