/**
 * Honeypot spam protection for the contact form (audit FORM-2).
 *
 * The contact form renders a `website` input that is positioned off-screen,
 * removed from the tab order and hidden from assistive tech, so no real
 * visitor has a keyboard or pointer path to it. Naive spam bots fill every
 * input they find in the DOM, so a non-empty value is a reliable automation
 * signal.
 *
 * This lives outside the form component on purpose: the decision has to be
 * made on the server (src/services/contact.service.ts), where a client can't
 * skip it by editing or removing the field in the browser.
 */
export function isHoneypotFilled(value: string | null | undefined): boolean {
  return typeof value === "string" && value.trim() !== "";
}
