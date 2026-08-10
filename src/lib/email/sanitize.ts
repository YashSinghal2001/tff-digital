import "server-only";

/**
 * Strips CR/LF/NUL/tab characters from a value before it's used in an email
 * header (Subject, Reply-To). Lead-submitted text (name, message) is free-form
 * user input and must never be trusted directly in a header context — a
 * newline there is a classic header-injection vector.
 */
export function sanitizeHeaderValue(value: string): string {
  return value.replace(/[\r\n\t\0]/g, " ").trim();
}

/**
 * Escapes HTML special characters so free-form lead input (name, message)
 * can't inject markup into the HTML email body.
 */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
