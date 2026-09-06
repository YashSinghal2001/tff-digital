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
  });

  test("submit control delegates to the animated SubmitButton (premium contact animation)", () => {
    // Loading/success/error visuals and the disabled/aria-disabled contract
    // now live in SubmitButton.tsx (see submit-button.test.ts) — this file
    // only pins that ContactForm drives it via a phase state machine and
    // that a real click can't double-fire while a submission is in flight.
    assert.match(
      SOURCE,
      /import \{ SubmitButton, type SubmitPhase \} from "@\/features\/contact\/SubmitButton";/,
    );
    assert.match(SOURCE, /<SubmitButton phase=\{phase\} \/>/);
    assert.match(SOURCE, /setPhase\("submitting"\)/);
    assert.doesNotMatch(SOURCE, /isSubmitting/);
  });

  test("the success animation is only entered after a real success response, and the redirect waits for its hold", () => {
    const branchStart = SOURCE.indexOf("if (result.success)");
    const successBranch = SOURCE.slice(
      branchStart,
      SOURCE.indexOf("setSubmitError(", branchStart),
    );
    assert.match(successBranch, /setPhase\("success"\)/);
    assert.match(successBranch, /await wait\(SUCCESS_HOLD_MS\)/);
    assert.match(successBranch, /router\.push\(ROUTES\.thankYou\)/);
    // The redirect must come after the hold, not before it.
    assert.ok(
      successBranch.indexOf("await wait(SUCCESS_HOLD_MS)") <
        successBranch.indexOf("router.push(ROUTES.thankYou)"),
    );
  });

  test("a failed submission never redirects and returns the button to idle for retry", () => {
    const errorBranch = SOURCE.slice(SOURCE.indexOf('setPhase("error")'));
    assert.doesNotMatch(errorBranch, /router\.push/);
    assert.match(errorBranch, /setPhase\("idle"\)/);
  });

  test("stale submissions can't clobber a newer one's phase (double-submit / race guard)", () => {
    assert.match(SOURCE, /submitTokenRef/);
    assert.match(SOURCE, /token !== submitTokenRef\.current/);
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
