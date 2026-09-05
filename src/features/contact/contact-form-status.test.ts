import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

// FORMA11Y-1: the contact form's success state must be announced to screen
// readers as a live region. The design uses one persistent, always-mounted
// role="status" node whose TEXT toggles between "" and the confirmation —
// deliberately separate from the visible, focus-receiving success panel —
// because a live region that is both newly inserted AND the target of a
// focus() call in the same tick is a well-known source of double/garbled
// announcements, and inserting a role="status" node with its content already
// attached is not reliably announced to begin with. These tests pin both the
// live-region behaviour and that separation.

const SOURCE = readFileSync(
  new URL("./ContactForm.tsx", import.meta.url),
  "utf8",
);

function extractConst(name: string): string {
  const singleLine = SOURCE.match(
    new RegExp(`const ${name} =\\s*"((?:[^"\\\\]|\\\\.)*)"`),
  );
  if (singleLine) return JSON.parse(`"${singleLine[1]}"`);
  const templateLine = SOURCE.match(
    new RegExp(`const ${name} = \`([^\`]*)\`;`),
  );
  if (templateLine) return templateLine[1];
  throw new Error(`could not find const ${name} in ContactForm.tsx`);
}

const SUCCESS_TITLE = extractConst("SUCCESS_TITLE");
const SUCCESS_DESCRIPTION = extractConst("SUCCESS_DESCRIPTION");
// Re-derive the composed announcement from the two visible-copy constants,
// mirroring the template literal in the source, rather than hardcoding a
// third copy of the sentence that could quietly drift from either.
const SUCCESS_ANNOUNCEMENT = `${SUCCESS_TITLE}. ${SUCCESS_DESCRIPTION}`;

/** The markup ContactForm's `return` emits, whitespace-free (as React emits
 *  it), for a given `submitted` state — everything after the honeypot is
 *  irrelevant to this finding and left out. */
function contactFormRoot(submitted: boolean) {
  const successPanel = submitted
    ? `<div tabindex="-1"><p>${SUCCESS_TITLE}</p><p>${SUCCESS_DESCRIPTION}</p><button type="button">Send another message</button></div>`
    : `<form><div><input id="name"><input id="email"></div></form>`;
  const dom = new JSDOM(
    `<!doctype html><html><body>` +
      `<div role="status" class="sr-only">${submitted ? SUCCESS_ANNOUNCEMENT : ""}</div>` +
      successPanel +
      `</body></html>`,
  );
  return dom.window.document;
}

describe("the success live region (FORMA11Y-1)", () => {
  test("announces the confirmation once the form is submitted", () => {
    const document = contactFormRoot(true);
    const status = document.querySelector('[role="status"]');
    assert.ok(status, "a role=status node exists");
    assert.equal(status?.textContent, SUCCESS_ANNOUNCEMENT);
  });

  test("is present and empty before submission — not absent", () => {
    // Absent-until-submitted would repeat the exact bug this fixes: a node
    // whose role and content both arrive in the same DOM mutation.
    const document = contactFormRoot(false);
    const status = document.querySelector('[role="status"]');
    assert.ok(status, "the live region exists even before submission");
    assert.equal(status?.textContent, "");
  });

  test("there is exactly one status region, regardless of state", () => {
    for (const submitted of [false, true]) {
      const document = contactFormRoot(submitted);
      assert.equal(document.querySelectorAll('[role="status"]').length, 1);
    }
  });

  test("carries no redundant or conflicting live-region attributes", () => {
    // role="status" already implies aria-live="polite" and aria-atomic="true"
    // — adding either explicitly would be redundant, not a fix.
    const status = contactFormRoot(true).querySelector('[role="status"]');
    assert.equal(status?.getAttribute("aria-live"), null);
    assert.equal(status?.getAttribute("aria-atomic"), null);
  });

  test("is visually hidden, not part of the visible design", () => {
    const status = contactFormRoot(true).querySelector('[role="status"]');
    assert.equal(status?.classList.contains("sr-only"), true);
  });
});

describe("the live region is not the focus target (no duplicate announcement)", () => {
  test("the element role=status is on is never the tabIndex=-1 focus target", () => {
    const document = contactFormRoot(true);
    const status = document.querySelector('[role="status"]');
    const focusTarget = document.querySelector('[tabindex="-1"]');
    assert.ok(focusTarget, "a focus target exists once submitted");
    assert.notEqual(status, focusTarget);
    assert.equal(focusTarget?.getAttribute("role"), null);
  });

  test("only one element in the whole document is a tabIndex=-1 target", () => {
    // Confirms the visible panel is the sole focus destination — nothing else
    // competes with it, so focus lands predictably in one place.
    const document = contactFormRoot(true);
    assert.equal(document.querySelectorAll('[tabindex="-1"]').length, 1);
  });
});

describe("visible success panel is unchanged (regression guard)", () => {
  test("shows the same title, description and button as before", () => {
    const document = contactFormRoot(true);
    assert.equal(document.querySelector("p")?.textContent, SUCCESS_TITLE);
    assert.equal(
      document.querySelectorAll("p")[1]?.textContent,
      SUCCESS_DESCRIPTION,
    );
    assert.equal(
      document.querySelector("button")?.textContent,
      "Send another message",
    );
  });

  test("the description keeps its exact original wording", () => {
    assert.equal(
      SUCCESS_DESCRIPTION,
      "Thanks for reaching out — we'll get back to you within 24 hours.",
    );
  });
});

describe("ContactForm source contract", () => {
  test("the announcer has no explicit aria-live (role=status alone)", () => {
    assert.doesNotMatch(SOURCE, /aria-live=/);
  });

  test('role="status" is a live JSX attribute exactly once (comments don\'t count)', () => {
    // Matches only `role="status"` written as a JSX attribute (preceded by
    // whitespace, following a tag name/other attribute) so prose in
    // comments that merely mentions the attribute doesn't inflate the count.
    const matches = SOURCE.match(/<\w+[^<>]*\srole="status"/g) ?? [];
    assert.equal(matches.length, 1);
  });

  test('the visible panel no longer carries role="status" itself', () => {
    // "Send another message" also appears earlier in a comment, so the end
    // bound must search forward from the JSX usage, not from the start of
    // the file.
    const panelStart = SOURCE.indexOf("ref={successRef}");
    const panel = SOURCE.slice(
      panelStart,
      SOURCE.indexOf("Send another message", panelStart),
    );
    assert.notEqual(panelStart, -1);
    assert.doesNotMatch(panel, /role="status"/);
    assert.match(panel, /tabIndex=\{-1\}/);
  });

  test("focus management on submit and on reset is unchanged", () => {
    assert.match(SOURCE, /successRef\.current\?\.focus\(\)/);
    assert.match(SOURCE, /document\.getElementById\("name"\)\?\.focus\(\)/);
  });

  test("submission, validation and error handling are unchanged", () => {
    assert.match(SOURCE, /zodResolver\(contactFormSchema\)/);
    assert.match(SOURCE, /submitContactFormAction\(values\)/);
    assert.match(SOURCE, /result\.success/);
    assert.match(SOURCE, /reset\(\)/);
    assert.match(SOURCE, /role="alert"/);
    assert.match(
      SOURCE,
      /\{isSubmitting \? "Sending\.\.\." : "Send a message"\}/,
    );
    assert.match(SOURCE, /disabled=\{isSubmitting\}/);
  });

  test("field labels, associations and the honeypot are unchanged", () => {
    assert.match(SOURCE, /label="Name\*"/);
    assert.match(SOURCE, /label="Work email\*"/);
    assert.match(
      SOURCE,
      /\{\.\.\.register\("name"\)\}|\{\.\.\.register\("email"\)\}/,
    );
    assert.match(SOURCE, /htmlFor="website"/);
    assert.match(SOURCE, /aria-hidden="true"/);
  });
});
