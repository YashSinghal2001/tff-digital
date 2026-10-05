import assert from "node:assert/strict";
import test, { beforeEach, describe } from "node:test";
import { JSDOM } from "jsdom";

import { withFaqAccordion } from "./blog-faq.ts";
import { bindFaqAccordion } from "./blog-faq-accordion.ts";

// jsdom: the accordion markup rendered by withFaqAccordion, driven by the
// delegated listener ArticleContent installs.
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://www.tffdigital.com/blog/post",
});
const { window } = dom;
const { document } = window;

const HTML = withFaqAccordion(
  '<h2 id="frequently-asked-questions">Frequently Asked Questions</h2>' +
    '<h3 id="q-one">One?</h3><p>Answer one.</p>' +
    '<h3 id="q-two">Two?</h3><p>Answer two.</p>' +
    '<h3 id="q-three">Three?</h3><p>Answer three.</p>' +
    '<h2 id="outro">Outro</h2><p>Bye.</p>',
);

let container: HTMLElement;
let unbind: () => void;

function button(n: number) {
  return container.querySelectorAll<HTMLButtonElement>("button[aria-controls]")[
    n
  ];
}
function panel(n: number) {
  return document.getElementById(button(n).getAttribute("aria-controls")!)!;
}
function state() {
  return [0, 1, 2].map(
    (n) =>
      `${button(n).getAttribute("aria-expanded")}/${panel(n).hidden ? "hidden" : "shown"}`,
  );
}
function click(target: Element) {
  target.dispatchEvent(new window.MouseEvent("click", { bubbles: true }));
}

beforeEach(() => {
  unbind?.();
  window.location.hash = "";
  document.body.innerHTML = `<div id="article">${HTML}</div>`;
  container = document.getElementById("article")!;
  unbind = bindFaqAccordion(container);
});

describe("blog FAQ accordion behaviour", () => {
  test("starts fully collapsed with real buttons", () => {
    assert.deepEqual(state(), ["false/hidden", "false/hidden", "false/hidden"]);
    assert.equal(
      container.querySelectorAll("h3 > button[type=button]").length,
      3,
    );
    assert.equal(
      container.textContent?.includes("Answer two."),
      true,
      "answers stay in the DOM",
    );
  });

  test("click opens, click again closes", () => {
    click(button(0));
    assert.deepEqual(state(), ["true/shown", "false/hidden", "false/hidden"]);
    click(button(0));
    assert.deepEqual(state(), ["false/hidden", "false/hidden", "false/hidden"]);
  });

  test("one open at a time: opening another closes the first", () => {
    click(button(0));
    click(button(1));
    assert.deepEqual(state(), ["false/hidden", "true/shown", "false/hidden"]);
  });

  test("clicks on the icon inside the button still toggle (delegation via closest)", () => {
    click(button(2).querySelector("svg path")!);
    assert.deepEqual(state(), ["false/hidden", "false/hidden", "true/shown"]);
  });

  test("clicks elsewhere in the article, or inside an open answer, change nothing", () => {
    click(button(1));
    click(document.getElementById("outro")!);
    click(panel(1).querySelector("p")!);
    assert.deepEqual(state(), ["false/hidden", "true/shown", "false/hidden"]);
  });

  test("the URL fragment opens the matching item on bind and on hashchange", () => {
    unbind();
    window.location.hash = "#q-two";
    unbind = bindFaqAccordion(container);
    assert.deepEqual(state(), ["false/hidden", "true/shown", "false/hidden"]);

    window.location.hash = "#q-three";
    window.dispatchEvent(new window.Event("hashchange"));
    assert.deepEqual(state(), ["false/hidden", "false/hidden", "true/shown"]);

    window.location.hash = "#outro";
    window.dispatchEvent(new window.Event("hashchange"));
    assert.deepEqual(
      state(),
      ["false/hidden", "false/hidden", "true/shown"],
      "non-FAQ anchors are ignored",
    );
  });

  test("cleanup removes the listeners", () => {
    unbind();
    click(button(0));
    assert.deepEqual(state(), ["false/hidden", "false/hidden", "false/hidden"]);
    unbind = () => {};
  });
});
