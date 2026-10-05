import { htmlToPlainText } from "@/lib/content/post-content";

// Blog FAQ auto-accordion. WordPress authors write a FAQ the way Gutenberg
// naturally produces it — a heading titled "Frequently Asked Questions"
// (or "FAQ"/"FAQs"), then one sub-heading per question with the answer
// blocks underneath, until the next heading of the FAQ title's own level
// (or the end of the post). This rewrites exactly that shape into the
// WAI-ARIA accordion pattern (heading > button[aria-expanded] + hidden
// region) and leaves every other byte of the post alone. Runs AFTER
// sanitizeWpHtml and withHeadingIds: the input is a balanced, allowlisted
// tree whose h2/h3 already carry the ids the table of contents links to,
// and those ids are kept on the question headings so the anchors still land.

const HEADING = /<h([2-6])\b([^>]*)>([\s\S]*?)<\/h\1>/gi;
const FAQ_TITLE = /^(?:frequently asked questions|faqs?):?$/i;
const ID_ATTR = /\sid="([^"]*)"/;

interface Heading {
  index: number;
  end: number;
  level: number;
  attrs: string;
  inner: string;
}

export interface BlogFaqItem {
  /** Anchor id of the question heading (kept from withHeadingIds, or generated). */
  id: string;
  /** Question heading's attribute string, verbatim (class, id, ...). */
  attrs: string;
  /** Question heading's inner HTML, verbatim. */
  question: string;
  /** Everything between this question heading and the next, verbatim. */
  answer: string;
}

export interface BlogFaqSection {
  /** Heading level of the FAQ title; questions are one level deeper. */
  level: number;
  items: BlogFaqItem[];
}

function headingsOf(html: string): Heading[] {
  return [...html.matchAll(HEADING)].map((match) => ({
    index: match.index,
    end: match.index + match[0].length,
    level: Number(match[1]),
    attrs: match[2],
    inner: match[3],
  }));
}

/**
 * Locates the FAQ section and splits it into question/answer pairs, or
 * returns null when the post has no FAQ title heading, no question
 * sub-headings under it, or any question/answer resolves to blank text
 * (a half-authored FAQ renders as plain headings rather than as a broken
 * accordion — never throws). Only the first FAQ title heading is honoured.
 */
export function findBlogFaqSection(
  html: string,
): (BlogFaqSection & { start: number; end: number }) | null {
  const headings = headingsOf(html);
  const titleIndex = headings.findIndex((heading) =>
    FAQ_TITLE.test(htmlToPlainText(heading.inner)),
  );
  if (titleIndex < 0) return null;

  const { level } = headings[titleIndex];
  const nextSectionIndex = headings.findIndex(
    (heading, index) => index > titleIndex && heading.level <= level,
  );
  const end =
    nextSectionIndex < 0 ? html.length : headings[nextSectionIndex].index;
  const questions = headings
    .slice(titleIndex + 1, nextSectionIndex < 0 ? undefined : nextSectionIndex)
    .filter((heading) => heading.level === level + 1);
  if (questions.length === 0) return null;

  const items: BlogFaqItem[] = questions.map((heading, index) => ({
    id: ID_ATTR.exec(heading.attrs)?.[1] || `blog-faq-${index + 1}`,
    attrs: heading.attrs,
    question: heading.inner,
    answer: html.slice(heading.end, questions[index + 1]?.index ?? end).trim(),
  }));
  if (
    items.some(
      (item) =>
        !htmlToPlainText(item.question) || !htmlToPlainText(item.answer),
    )
  ) {
    return null;
  }

  return { level, items, start: questions[0].index, end };
}

// lucide "plus": the vertical bar fades out when the button is expanded, so
// the same glyph reads as "minus" — one SVG, no icon swap to keep in sync.
const PLUS_ICON =
  '<svg class="h-4 w-4 shrink-0 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
  '<path d="M5 12h14"/>' +
  '<path d="M12 5v14" class="transition-opacity duration-200 group-aria-expanded:opacity-0 motion-reduce:transition-none"/>' +
  "</svg>";

const BUTTON_CLASS =
  "group flex w-full items-center justify-between gap-4 rounded-2xl px-5 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-primary/50";

// Collapsed via the `hidden` attribute (display:none) rather than omitted —
// answers must stay in the server HTML for crawlers and aria-controls must
// point at a real node (same contract as sections/shared/FAQ.tsx). The
// `starting:` utilities give the newly displayed panel a short fade/rise
// (CSS @starting-style, no JS); collapse is instant by design.
const PANEL_CLASS =
  "space-y-3 px-5 pb-4 transition-[opacity,translate] duration-200 ease-out starting:-translate-y-1 starting:opacity-0 motion-reduce:transition-none";

function renderItem(item: BlogFaqItem, level: number): string {
  const tag = `h${level + 1}`;
  const panelId = `${item.id}-panel`;
  const headingAttrs = ID_ATTR.test(item.attrs)
    ? item.attrs
    : `${item.attrs} id="${item.id}"`;
  return (
    '<div class="rounded-2xl border border-border-subtle bg-glass" data-faq-item>' +
    `<${tag}${headingAttrs} data-faq-question>` +
    `<button type="button" class="${BUTTON_CLASS}" aria-expanded="false" aria-controls="${panelId}">` +
    `<span>${item.question}</span>${PLUS_ICON}</button></${tag}>` +
    `<div id="${panelId}" role="region" aria-labelledby="${item.id}" class="${PANEL_CLASS}" hidden>` +
    `${item.answer}</div></div>`
  );
}

/**
 * Returns `html` with its FAQ question/answer pairs rewritten as accordion
 * markup, or `html` unchanged when findBlogFaqSection finds nothing. The
 * FAQ title heading, anything between it and the first question, and all
 * content before/after the section pass through byte-for-byte; question
 * and answer HTML is moved, never rewritten.
 */
export function withFaqAccordion(html: string): string {
  const section = findBlogFaqSection(html);
  if (!section) return html;

  const accordion =
    '<div class="flex flex-col gap-3" data-faq-accordion>' +
    section.items.map((item) => renderItem(item, section.level)).join("") +
    "</div>";

  return html.slice(0, section.start) + accordion + html.slice(section.end);
}
