/**
 * Focus trap for modal-like UI that lives inside the page (A11Y-4: the
 * mobile navigation). Plain DOM, no React, so the behaviour is unit-testable
 * under `node --test` with jsdom and reusable by any client component.
 *
 * While a trap is active:
 * - focus moves into the container (a caller-chosen element, else the
 *   first tabbable);
 * - Tab/Shift+Tab cycle through the container's visible tabbables and wrap
 *   at both ends; a Tab from anywhere else (body, a stray click target)
 *   re-enters at the first tabbable;
 * - every other top-level region of the page (the container's siblings)
 *   is marked `inert`, so it can neither be focused — by keyboard, by
 *   script, nor through assistive technology — nor clicked;
 * - Escape calls `onEscape`, which is where the caller closes and restores
 *   focus to the trigger.
 *
 * The trap never prevents a Tab it can't act on: if nothing in the container
 * is visible (a stale-open state after the viewport widened past the mobile
 * breakpoint), the keyboard keeps working normally.
 */

const TABBABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * `display: none` anywhere up the tree leaves an element with no client
 * rects. Preferred over `offsetParent`, which is also null for descendants
 * of a `position: fixed` ancestor — exactly where the site header lives.
 */
export function isRendered(element: HTMLElement): boolean {
  return element.getClientRects().length > 0;
}

export function getTabbableElements(
  container: HTMLElement,
  isVisible: (element: HTMLElement) => boolean = isRendered,
): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(TABBABLE_SELECTOR),
  ).filter(isVisible);
}

/** Marks every element sibling of `container` inert; returns the undo. */
function inertSiblings(container: HTMLElement): () => void {
  const parent = container.parentElement;
  if (!parent) return () => {};
  const marked = Array.from(parent.children).filter(
    (sibling): sibling is HTMLElement =>
      sibling !== container &&
      sibling instanceof HTMLElement &&
      !sibling.hasAttribute("inert"),
  );
  for (const sibling of marked) sibling.setAttribute("inert", "");
  return () => {
    for (const sibling of marked) sibling.removeAttribute("inert");
  };
}

export interface FocusTrapOptions {
  /** The region focus is confined to (everything tabbable inside it). */
  container: HTMLElement;
  /** Receives focus on activation; defaults to the first tabbable. */
  initialFocus?: HTMLElement | null;
  /** Called on Escape — close the UI and restore focus to its trigger. */
  onEscape: () => void;
  /** Visibility predicate; only overridden by tests (no layout in jsdom). */
  isVisible?: (element: HTMLElement) => boolean;
}

/** Activates the trap; call the returned function to release it. */
export function createFocusTrap({
  container,
  initialFocus,
  onEscape,
  isVisible = isRendered,
}: FocusTrapOptions): () => void {
  const releaseInert = inertSiblings(container);

  const target =
    initialFocus ?? getTabbableElements(container, isVisible)[0] ?? null;
  target?.focus({ preventScroll: true });

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onEscape();
      return;
    }
    if (event.key !== "Tab") return;

    const tabbables = getTabbableElements(container, isVisible);
    if (tabbables.length === 0) return;
    const first = tabbables[0];
    const last = tabbables[tabbables.length - 1];
    const active = document.activeElement;

    if (!(active instanceof HTMLElement) || !tabbables.includes(active)) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus({ preventScroll: true });
    } else if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus({ preventScroll: true });
    }
    // Any other Tab stays inside the container: the browser's default
    // sequential focus is correct, so it is left alone.
  };

  document.addEventListener("keydown", onKeyDown);
  return () => {
    document.removeEventListener("keydown", onKeyDown);
    releaseInert();
  };
}
