import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

// A11Y-FOOTER-1: the footer newsletter field was named only by aria-label,
// with no label element and in fact no id at all, so nothing was associated
// with it. Two halves are checked here: that a label/input pair of the shape
// the shared Input renders really does name the control (and that the
// placeholder is only ever a last resort), and that the Footer and Input
// sources still produce that shape.

const FOOTER = readFileSync(new URL("./Footer.tsx", import.meta.url), "utf8");
const INPUT = readFileSync(new URL("../ui/Input.tsx", import.meta.url), "utf8");
const INPUT_ID = "footer-newsletter-email";
const LABEL = "Email address";
const PLACEHOLDER = "you@company.com";

/**
 * Accessible name for a text input, in specification order. Deliberately
 * ends at `placeholder` so a test can show what the name would degrade to.
 */
function accessibleName(input: HTMLInputElement, document: Document): string {
  const labelledBy = input.getAttribute("aria-labelledby");
  if (labelledBy) {
    return labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? "")
      .filter(Boolean)
      .join(" ");
  }
  const ariaLabel = input.getAttribute("aria-label");
  if (ariaLabel?.trim()) return ariaLabel.trim();
  const labels = Array.from(input.labels ?? []);
  if (labels.length > 0) {
    return labels
      .map((label) => label.textContent?.trim() ?? "")
      .filter(Boolean)
      .join(" ");
  }
  return input.getAttribute("placeholder")?.trim() ?? "";
}

/** The markup the shared Input emits for `label` + `hideLabel` + `id`. */
function renderFooterField(options: { withLabel?: boolean } = {}) {
  const { withLabel = true } = options;
  const dom = new JSDOM(`<!doctype html><html><body>
    <form>
      <div class="flex flex-col gap-2">
        ${withLabel ? `<label for="${INPUT_ID}" class="font-body text-sm text-muted sr-only">${LABEL}</label>` : ""}
        <input id="${INPUT_ID}" type="email" placeholder="${PLACEHOLDER}" required />
      </div>
      <button type="submit">Subscribe</button>
    </form>
  </body></html>`);
  const { document } = dom.window;
  return {
    document,
    input: document.getElementById(INPUT_ID) as HTMLInputElement,
    label: document.querySelector("label"),
  };
}

describe("footer newsletter field is properly labelled (A11Y-FOOTER-1)", () => {
  test("the input's accessible name comes from the label, not the placeholder", () => {
    const { document, input } = renderFooterField();
    assert.equal(accessibleName(input, document), LABEL);
    assert.notEqual(accessibleName(input, document), PLACEHOLDER);
  });

  test("the label is associated with the input in both directions", () => {
    const { input, label } = renderFooterField();
    assert.equal(label?.getAttribute("for"), input.id);
    // `labels`/`control` are resolved by the DOM itself, so this passes only
    // when the association is real rather than a matching pair of strings.
    assert.deepEqual(Array.from(input.labels ?? []), [label]);
    assert.equal((label as HTMLLabelElement).control, input);
  });

  test("the label is hidden visually but still in the accessibility tree", () => {
    const { label } = renderFooterField();
    assert.ok(
      label?.classList.contains("sr-only"),
      "uses the repo's sr-only utility",
    );
    assert.equal(label?.hasAttribute("hidden"), false);
    assert.equal(label?.getAttribute("aria-hidden"), null);
  });

  test("without the label the name would fall back to the placeholder", () => {
    // Pins that the label really is what supplies the name: this is the
    // pre-fix state the audit flagged.
    const { document, input } = renderFooterField({ withLabel: false });
    assert.deepEqual(Array.from(input.labels ?? []), []);
    assert.equal(accessibleName(input, document), PLACEHOLDER);
  });

  test("the placeholder and required flag survive alongside the label", () => {
    const { input } = renderFooterField();
    assert.equal(input.getAttribute("placeholder"), PLACEHOLDER);
    assert.equal(input.required, true);
    assert.equal(input.type, "email");
  });
});

describe("Footer and Input sources still emit that shape", () => {
  test("the newsletter Input gets an id, a label and hideLabel", () => {
    assert.match(
      FOOTER,
      /const NEWSLETTER_INPUT_ID = "footer-newsletter-email";/,
    );
    const field = FOOTER.slice(
      FOOTER.indexOf("<Input"),
      FOOTER.indexOf("</form>"),
    );
    assert.match(field, /id=\{NEWSLETTER_INPUT_ID\}/);
    assert.match(field, /label="Email address"/);
    assert.match(field, /\bhideLabel\b/);
  });

  test("no aria-label overrides the associated label", () => {
    // aria-label wins over a label element in the name computation, so
    // leaving it here would make the association decorative.
    const field = FOOTER.slice(
      FOOTER.indexOf("<Input"),
      FOOTER.indexOf("</form>"),
    );
    assert.doesNotMatch(field, /aria-label=/);
  });

  test("the newsletter keeps its existing behaviour and copy", () => {
    assert.match(FOOTER, /placeholder="you@company\.com"/);
    assert.match(FOOTER, /required/);
    assert.match(FOOTER, /value=\{email\}/);
    assert.match(
      FOOTER,
      /onChange=\{\(event\) => setEmail\(event\.target\.value\)\}/,
    );
    assert.match(FOOTER, /event\.preventDefault\(\)/);
    assert.match(FOOTER, /if \(!email\.trim\(\)\) return;/);
    assert.match(FOOTER, /Subscribe/);
    assert.match(FOOTER, /role="status"/);
  });

  test("Input associates its label and hides it only when asked", () => {
    assert.match(INPUT, /htmlFor=\{inputId\}/);
    assert.match(INPUT, /hideLabel && "sr-only"/);
    assert.match(INPUT, /export function Input\(\{ label, hideLabel,/);
    // The id an explicit `id` prop supplies is what htmlFor points at.
    assert.match(INPUT, /const inputId = id \?\? props\.name;/);
  });

  test("the newsletter input id is unique to the footer", () => {
    // The contact form's email field derives id "email" from its name, and
    // the blog newsletter uses "newsletter-email"; a clash would break both
    // associations on a page showing two of them.
    assert.doesNotMatch(FOOTER, /id="newsletter-email"/);
    assert.notEqual(INPUT_ID, "newsletter-email");
    assert.notEqual(INPUT_ID, "email");
  });
});
