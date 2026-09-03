export type EmailErrorKind = "config" | "smtp";

/**
 * Thrown by the SMTP client/service so callers can distinguish "email isn't
 * configured yet" from a real send failure, instead of a bare Error. Mirrors
 * WordPressError (src/lib/wordpress/errors.ts) for the same reason: typed
 * failure kinds without leaking provider detail to callers.
 */
export class EmailError extends Error {
  readonly kind: EmailErrorKind;

  constructor(message: string, kind: EmailErrorKind, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "EmailError";
    this.kind = kind;
  }
}

export function isEmailError(error: unknown): error is EmailError {
  return error instanceof EmailError;
}
