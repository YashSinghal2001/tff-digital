import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// Premium contact-form submit animation. Same convention as
// contact-form-success.test.ts: source-level assertions rather than a
// rendered-DOM test, since the repo has no React Testing Library dep and
// this is a framer-motion-heavy component not worth a new dep to render.

const SOURCE = readFileSync(
  new URL("./SubmitButton.tsx", import.meta.url),
  "utf8",
);

describe("SubmitButton animation contract", () => {
  test("covers all four phases without inventing extra ones", () => {
    assert.match(
      SOURCE,
      /export type SubmitPhase = "idle" \| "submitting" \| "success" \| "error";/,
    );
  });

  test("the button is disabled only while submitting or in the success hold", () => {
    assert.match(
      SOURCE,
      /const isBusy = phase === "submitting" \|\| phase === "success";/,
    );
    assert.match(SOURCE, /disabled=\{isBusy\}/);
    assert.match(SOURCE, /aria-disabled=\{isBusy\}/);
    // Error phase is deliberately NOT busy — the user must be able to
    // retry immediately without waiting out the shake/hold.
    const isBusyLine = SOURCE.match(/const isBusy = [^\n]*/)?.[0] ?? "";
    assert.doesNotMatch(isBusyLine, /phase === "error"/);
  });

  test("width only contracts on success — loading keeps the button's position stable", () => {
    assert.match(SOURCE, /width: phase === "success" \? 46 : "100%"/);
  });

  test("the checkmark is a self-drawing stroke, not a static icon", () => {
    assert.match(SOURCE, /initial=\{\{ pathLength: 0 \}\}/);
    assert.match(SOURCE, /animate=\{\{ pathLength: 1 \}\}/);
  });

  test("success re-uses the existing brand glow token rather than a new color", () => {
    assert.match(SOURCE, /shadow-\[var\(--shadow-glow\)\]/);
  });

  test("reduced motion takes a structurally simpler path: no morph, no spinner, no path draw", () => {
    const reducedBranch = SOURCE.slice(
      SOURCE.indexOf("prefersReducedMotion ? ("),
      SOURCE.indexOf(") : ("),
    );
    assert.doesNotMatch(reducedBranch, /animate-spin/);
    assert.doesNotMatch(reducedBranch, /pathLength/);
    assert.doesNotMatch(reducedBranch, /AnimatePresence/);
  });

  test("the spinner keyframe carries a motion-reduce counterpart (A11Y-5 sitewide guard)", () => {
    assert.match(
      SOURCE,
      /animate-spin motion-reduce:\[animation-duration:2\.4s\]/,
    );
  });

  test("a persistent live region announces phase changes independent of the visible label", () => {
    assert.match(SOURCE, /aria-live="polite" className="sr-only"/);
    assert.match(SOURCE, /STATUS_MESSAGE\[phase\]/);
    assert.match(
      SOURCE,
      /submitting: "Sending your message…",\s*\n\s*success: "Message sent\."/,
    );
  });

  test("no fake success: the component only ever reflects the phase prop it's given", () => {
    // SubmitButton has no submission logic of its own — it can't decide to
    // show success; that call is entirely ContactForm's, gated on a real
    // API response (see contact-form-success.test.ts).
    assert.doesNotMatch(SOURCE, /fetch\(|submitContactFormAction/);
  });
});
