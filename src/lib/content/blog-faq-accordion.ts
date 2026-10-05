// Client-side behaviour for the accordion markup withFaqAccordion emits
// (src/lib/content/blog-faq.ts). The markup lives inside ArticleContent's
// dangerouslySetInnerHTML, so React never owns it: one delegated click
// listener on the article container toggles aria-expanded + the panel's
// `hidden` attribute, keeping one item open at a time. Server HTML and
// initial client state agree by construction (every panel ships hidden).

const FAQ_BUTTON = "[data-faq-accordion] button[aria-controls]";

function setExpanded(button: HTMLButtonElement, expanded: boolean): void {
  button.setAttribute("aria-expanded", String(expanded));
  const panel = button.ownerDocument.getElementById(
    button.getAttribute("aria-controls") ?? "",
  );
  if (panel) panel.hidden = !expanded;
}

/** Expands `button`'s panel and collapses its siblings; collapses it if already open. */
export function toggleFaqItem(button: HTMLButtonElement): void {
  const expand = button.getAttribute("aria-expanded") !== "true";
  button
    .closest("[data-faq-accordion]")
    ?.querySelectorAll<HTMLButtonElement>("button[aria-controls]")
    .forEach((sibling) => {
      if (sibling !== button) setExpanded(sibling, false);
    });
  setExpanded(button, expand);
}

/**
 * Wires every FAQ accordion inside `container`. Also opens the item whose
 * question heading the URL fragment targets — on bind and on every
 * hashchange — so table-of-contents links land on a visible answer.
 * Returns the cleanup for useEffect.
 */
export function bindFaqAccordion(container: HTMLElement): () => void {
  const view = container.ownerDocument.defaultView;

  const onClick = (event: Event) => {
    const button = (
      event.target as Element | null
    )?.closest?.<HTMLButtonElement>(FAQ_BUTTON);
    if (button && container.contains(button)) toggleFaqItem(button);
  };

  const openFromHash = () => {
    const id = view?.location.hash.slice(1);
    const button = id
      ? container.ownerDocument
          .getElementById(id)
          ?.closest("[data-faq-item]")
          ?.querySelector<HTMLButtonElement>(FAQ_BUTTON)
      : null;
    if (
      button &&
      container.contains(button) &&
      button.getAttribute("aria-expanded") !== "true"
    ) {
      toggleFaqItem(button);
    }
  };

  container.addEventListener("click", onClick);
  view?.addEventListener("hashchange", openFromHash);
  openFromHash();

  return () => {
    container.removeEventListener("click", onClick);
    view?.removeEventListener("hashchange", openFromHash);
  };
}
