/**
 * Storage for the cookie-notice banner's decision (CLIENT-5), plus Google
 * Consent Mode v2 wiring. Plain localStorage read/write, no React, so it's
 * unit-testable under `node --test` with jsdom the same way
 * src/lib/a11y/focus-trap.ts is.
 *
 * The site loads Google Tag Manager (src/app/layout.tsx), which loads a GA4
 * tag (G-JFL5GJ6W9S, configured in the GTM console) — so "accepted"/
 * "rejected" now gate real analytics collection via Consent Mode:
 * src/app/layout.tsx pushes a 'denied' default before GTM ever loads, and
 * this module pushes a 'consent update' reflecting the decision, both when
 * the visitor decides and when a returning visitor's stored decision is
 * restored on mount (see restoreConsentMode, called from
 * CookieConsentBanner.tsx). GA4 reads Consent Mode automatically; this site
 * runs no ad tags, so only analytics_storage is ever updated here.
 */

export const COOKIE_CONSENT_STORAGE_KEY = "tff-cookie-consent";

export type CookieConsentDecision = "accepted" | "rejected";

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

/**
 * Pushes a Consent Mode 'update' reflecting the decision. Mirrors Google's
 * documented inline gtag shim (push a gtag-style call onto dataLayer)
 * instead of depending on gtag.js/GTM having finished loading — GTM reads
 * dataLayer entries pushed either before or after it initializes.
 */
export function updateConsentMode(decision: CookieConsentDecision): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  }
  gtag("consent", "update", {
    analytics_storage: decision === "accepted" ? "granted" : "denied",
  });
}

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

/**
 * Persists the visitor's decision and applies it to Consent Mode. Storage
 * failures are silent (the banner will simply reappear next visit); the
 * Consent Mode push always happens regardless, since it doesn't depend on
 * storage succeeding.
 */
export function setCookieConsent(decision: CookieConsentDecision): void {
  updateConsentMode(decision);
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, decision);
  } catch {
    // Storage unavailable — the banner will simply reappear next visit.
  }
}

/**
 * Re-applies a previously-stored decision's Consent Mode state. No-op for a
 * first-time visitor (nothing stored yet, so the layout.tsx default of
 * 'denied' already stands). Call once, on mount, before the visitor can
 * interact with the banner again.
 */
export function restoreConsentMode(): void {
  const decision = getCookieConsent();
  if (decision) updateConsentMode(decision);
}
