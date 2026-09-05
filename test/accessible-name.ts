/**
 * Accessible-name resolution for tests, following the specification's
 * ordering closely enough to catch naming regressions: aria-labelledby, then
 * aria-label, then the element's own content — with `aria-hidden` subtrees
 * dropped and `<img>` contributing its alt text, the way a screen reader
 * builds the name for a link that wraps a whole card.
 *
 * Deliberately falls through to content rather than stopping, so a test can
 * assert what a name would degrade to if its label were removed.
 */
export function accessibleName(element: Element, document: Document): string {
  const labelledBy = element.getAttribute("aria-labelledby");
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  const ariaLabel = element.getAttribute("aria-label");
  if (ariaLabel?.trim()) return ariaLabel.trim();

  return contentName(element).replace(/\s+/g, " ").trim();
}

function contentName(node: Node): string {
  if (node.nodeType === node.TEXT_NODE) return node.textContent ?? "";
  if (node.nodeType !== node.ELEMENT_NODE) return "";

  const element = node as Element;
  if (element.getAttribute("aria-hidden") === "true") return "";
  if (element.tagName === "IMG") return element.getAttribute("alt") ?? "";

  return Array.from(element.childNodes).map(contentName).join("");
}
