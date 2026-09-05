import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// CLIENT-2: successful submission now navigates to a dedicated Thank You
// route (src/app/thank-you/page.tsx) instead of swapping in an in-page
// confirmation panel. That in-page panel used to carry its own
// role="status" live region and manual focus management (formerly
// FORMA11Y-1) — both are gone because a full route change already gets an
// accessible announcement for free from Next's App Router (its built-in
// route announcer reads the destination page's title/heading), so there is
// no live region left to keep in sync and no focus target that unmounts out
// from under a keyboard user. This file pins the new contract; the
// destination page's own content is exercised in thank-you-page.test.ts.

const SOURCE = readFileSync(
  new URL("./ContactForm.tsx", import.meta.url),
  "utf8",
);

describe("ContactForm success behaviour (CLIENT-2)", () => {
  test("routes to the Thank You page via the App Router on success", () => {
    assert.match(SOURCE, /import \{ useRouter \} from "next\/navigation";/);
    assert.match(SOURCE, /const router = useRouter\(\);/);
    assert.match(SOURCE, /router\.push\(ROUTES\.thankYou\)/);
  });

  test("the redirect only fires inside the result.success branch", () => {
    const branchStart = SOURCE.indexOf("if (result.success)");
    const successBranch = SOURCE.slice(
      branchStart,
      SOURCE.indexOf("setSubmitError(", branchStart),
    );
    assert.match(successBranch, /router\.push\(ROUTES\.thankYou\)/);
  });

  test("no leftover in-page success panel, live region or focus management", () => {
    // JSX usage only (a comment may still mention role="status" in prose
    // explaining why it's no longer needed).
    assert.doesNotMatch(SOURCE, /<\w+[^<>]*\srole="status"/);
    assert.doesNotMatch(SOURCE, /successRef/);
    assert.doesNotMatch(SOURCE, /wasSubmitted/);
    assert.doesNotMatch(SOURCE, /Send another message/);
  });

  test("submission, validation and error handling are otherwise unchanged", () => {
    assert.match(SOURCE, /zodResolver\(contactFormSchema\)/);
    assert.match(SOURCE, /submitContactFormAction\(values\)/);
    assert.match(SOURCE, /result\.success/);
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
