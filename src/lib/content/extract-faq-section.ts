import { htmlToPlainText } from "@/lib/content/post-content";

export interface HtmlFaqItem {
  question: string;
  answer: string;
}

export interface FaqSectionExtraction {
  /** `html` with the marked FAQ section (if any) removed entirely. */
  html: string;
  /** FAQ items parsed from the marked section; empty when none was found or none parsed cleanly. */
  faqs: HtmlFaqItem[];
}

// Matches only the opening tag of the one recognized marker section
// (data-content-section="faq"; single- or double-quoted). Only the first
// match is honored — one canonical FAQ section per page, the same
// single-source-of-truth contract buildFaqJsonLd and the visible accordion
// already share.
const FAQ_SECTION_OPEN = /<section\b[^>]*\bdata-content-section\s*=\s*(["'])faq\1[^>]*>/i;

const SECTION_TAG = /<(\/?)section\b[^>]*>/gi;

/**
 * Finds the end (index of the `<` in the matching `</section>`) of the
 * <section> that opened at `contentStart` (depth 1), walking nested
 * <section> tags. Assumes well-formed input — this only ever runs on
 * sanitizeWpHtml's output, which is always a balanced tree (ARCH-5) — so an
 * opening tag is guaranteed a matching close; a malformed fragment that
 * somehow reached this far just runs to the end of the string instead of
 * throwing.
 */
function findSectionClose(html: string, contentStart: number): number {
  let depth = 1;
  SECTION_TAG.lastIndex = contentStart;
  let match: RegExpExecArray | null;
  while ((match = SECTION_TAG.exec(html))) {
    depth += match[1] === "/" ? -1 : 1;
    if (depth === 0) return match.index;
  }
  return html.length;
}

const DETAILS_BLOCK = /<details\b[^>]*>([\s\S]*?)<\/details>/gi;
const SUMMARY_BLOCK = /<summary\b[^>]*>([\s\S]*?)<\/summary>/i;

/**
 * One <details><summary>Q</summary>A</details> block → a FAQ item, or null
 * when the block has no <summary>, or resolves to a blank question or
 * answer — the same "drop anything incomplete" tolerance
 * parseServiceFaqs applies to the ACF repeater, so a half-authored block
 * just doesn't render rather than breaking the page.
 */
function parseDetailsBlock(inner: string): HtmlFaqItem | null {
  const summaryMatch = SUMMARY_BLOCK.exec(inner);
  if (!summaryMatch) return null;

  const question = htmlToPlainText(summaryMatch[1]).trim();
  const answerHtml =
    inner.slice(0, summaryMatch.index) +
    inner.slice(summaryMatch.index + summaryMatch[0].length);
  const answer = htmlToPlainText(answerHtml).trim();

  if (!question || !answer) return null;
  return { question, answer };
}

/**
 * Pulls the CMS-authored FAQ section (CONTENT-FAQ) out of a service's
 * sanitized customHtmlContent: a <section data-content-section="faq"> whose
 * <details>/<summary> children become the same { question, answer } shape
 * as the ACF faqs repeater, so both sources can feed the shared FAQ
 * component and buildFaqJsonLd from one variable. Call this AFTER
 * sanitizeWpHtml — it relies on the sanitizer's well-formed output, and on
 * data-content-section having already survived (or been dropped by) that
 * allowlist.
 *
 * Arbitrary <details> elsewhere in the content — outside this one marked
 * section — are left untouched; only the marked section is ever removed
 * from the returned `html`, so unrelated content that happens to use
 * <details> for something else keeps rendering exactly as authored. When no
 * marker is present, or the marked section yields no valid items, this
 * returns the original html unchanged (bar section removal) and an empty
 * faqs array — never throws on malformed CMS input.
 */
export function extractFaqSection(html: string): FaqSectionExtraction {
  const openMatch = FAQ_SECTION_OPEN.exec(html);
  if (!openMatch) return { html, faqs: [] };

  const sectionStart = openMatch.index;
  const contentStart = sectionStart + openMatch[0].length;
  const closeTagStart = findSectionClose(html, contentStart);
  const closeTagEnd = html.indexOf(">", closeTagStart) + 1;

  const inner = html.slice(contentStart, closeTagStart);
  const faqs: HtmlFaqItem[] = [];
  DETAILS_BLOCK.lastIndex = 0;
  let detailsMatch: RegExpExecArray | null;
  while ((detailsMatch = DETAILS_BLOCK.exec(inner))) {
    const item = parseDetailsBlock(detailsMatch[1]);
    if (item) faqs.push(item);
  }

  const remainingHtml = html.slice(0, sectionStart) + html.slice(closeTagEnd);
  return { html: remainingHtml, faqs };
}
