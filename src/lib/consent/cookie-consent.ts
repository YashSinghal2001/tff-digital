/**
 * Storage for the cookie-notice banner's decision (CLIENT-5). Plain
 * localStorage read/write, no React, so it's unit-testable under
 * `node --test` with jsdom the same way src/lib/a11y/focus-trap.ts is.
 *
 * The site loads no analytics/advertising scripts, so "accepted" and
 * "rejected" are not gates for anything — both simply record that the
 * visitor has seen and dismissed the notice, matching the Cookie Policy.
 */

export const COOKIE_CONSENT_STORAGE_KEY = "tff-cookie-consent";

export type CookieConsentDecision = "accepted" | "rejected";

function isCookieConsentDecision(
  value: unknown,
): value is CookieConsentDecision {
  return value === "accepted" || value === "rejected";
}

/**
 * Returns the stored decision, or `null` if none exists yet or storage is
 * unavailable (private browsing, disabled storage, a non-browser
 * environment). Storage errors must never surface to the caller — the
 * banner simply shows again next time.
 */
export function getCookieConsent(): CookieConsentDecision | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
    return isCookieConsentDecision(value) ? value : null;
  } catch {
    return null;
  }
}

/** Persists the visitor's decision. Fails silently if storage throws. */
export function setCookieConsent(decision: CookieConsentDecision): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, decision);
  } catch {
    // Storage unavailable — the banner will simply reappear next visit.
  }
}
