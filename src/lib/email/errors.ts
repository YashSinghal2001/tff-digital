export type EmailErrorKind = "config" | "http";

/**
 * Thrown by the Resend client/service so callers can distinguish "email
 * isn't configured yet" from a real provider failure, instead of a bare
 * Error. Mirrors WordPressError (src/lib/wordpress/errors.ts) for the same
 * reason: typed failure kinds without leaking provider detail to callers.
 */
export class EmailError extends Error {
  readonly kind: EmailErrorKind;

  constructor(message: string, kind: EmailErrorKind) {
    super(message);
    this.name = "EmailError";
    this.kind = kind;
  }
}

export function isEmailError(error: unknown): error is EmailError {
  return error instanceof EmailError;
}
