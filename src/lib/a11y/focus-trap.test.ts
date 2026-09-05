import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe } from "node:test";
import { JSDOM } from "jsdom";

// A11Y-4: the mobile navigation's focus trap, exercised against a DOM that
// mirrors src/app/layout.tsx + Navbar.tsx (skip link, header with logo /
// desktop nav / CTA / toggle / panel, main, footer) with the same Tailwind
// visibility classes. jsdom has no layout, so "rendered" is derived from
// those classes exactly as the mobile viewport would resolve them.

const dom = new JSDOM("<!doctype html><html><body></body></html>");
const { window } = dom;
Object.assign(globalThis, {
  window,
  document: window.document,
  HTMLElement: window.HTMLElement,
  KeyboardEvent: window.KeyboardEvent,
});
window.HTMLElement.prototype.getClientRects = function getClientRects() {
  const hidden = this.closest(".hidden, [hidden]") !== null;
  return (hidden ? [] : [{}]) as unknown as DOMRectList;
};

const { createFocusTrap, getTabbableElements } =
  await import("./focus-trap.ts");

const LINKS = [
  "About",
  "Services",
  "Process",
  "Work",
  "Testimonials",
  "Blog",
  "Contact",
];

function mountLayout() {
  document.body.innerHTML = `
    <a id="skip" href="#main-content">Skip to main content</a>
    <script id="jsonld" type="application/ld+json">{}</script>
    <header id="header" class="fixed">
      <a id="logo" href="/" aria-label="TFF Digital home"></a>
      <nav class="hidden xl:flex">
        ${LINKS.map((l) => `<a class="desktop" href="/${l}">${l}</a>`).join("")}
      </nav>
      <a id="desktop-cta" class="hidden xl:inline-flex" href="/contact">Book</a>
      <button id="toggle" type="button" class="xl:hidden" aria-expanded="false" aria-controls="mobile-nav-panel">Open menu</button>
      <div id="mobile-nav-panel" class="hidden xl:hidden">
        ${LINKS.map((l) => `<a class="panel-link" href="/${l}">${l}</a>`).join("")}
        <a id="panel-cta" href="/contact">Book Free Consultation</a>
      </div>
    </header>
    <main id="main-content" tabindex="-1">
      <a id="main-link" href="/case-studies">Case studies</a>
      <button id="main-button" type="button">Play</button>
    </main>
    <footer id="footer"><a id="footer-link" href="/privacy-policy">Privacy</a></footer>
  `;
}

const $ = (id: string) => document.getElementById(id) as HTMLElement;
const header = () => $("header");
const panel = () => $("mobile-nav-panel");
const toggle = () => $("toggle");
const active = () => document.activeElement as HTMLElement | null;

// Mirrors Navbar: open = show panel + trap; close = release + panel hidden
// + focus back on the toggle (the Navbar's `close`).
let release: (() => void) | null = null;
let escapes = 0;
function openMenu() {
  panel().classList.replace("hidden", "flex");
  toggle().setAttribute("aria-expanded", "true");
  release = createFocusTrap({
    container: header(),
    initialFocus: panel().querySelector<HTMLElement>("a[href]"),
    onEscape: () => {
      escapes += 1;
      closeMenu();
    },
  });
}
function closeMenu() {
  release?.();
  release = null;
  panel().classList.replace("flex", "hidden");
  toggle().setAttribute("aria-expanded", "false");
  toggle().focus();
}

function press(key: string, shiftKey = false): boolean {
  const event = new KeyboardEvent("keydown", {
    key,
    shiftKey,
    bubbles: true,
    cancelable: true,
  });
  (active() ?? document.body).dispatchEvent(event);
  return event.defaultPrevented;
}

const EXPECTED_CYCLE = [
  "logo",
  "toggle",
  ...LINKS.map((l) => `link:${l}`),
  "panel-cta",
];
const label = (element: HTMLElement) =>
  element.id
    ? element.classList.contains("panel-link")
      ? `link:${element.textContent}`
      : element.id
    : `link:${element.textContent}`;

describe("mobile navigation focus trap (A11Y-4)", () => {
  beforeEach(() => {
    mountLayout();
    escapes = 0;
    toggle().focus();
  });
  afterEach(() => {
    release?.();
    release = null;
  });

  test("opening the menu moves focus into it: the first panel link", () => {
    assert.equal(
      active(),
      toggle(),
      "precondition: the toggle opened the menu",
    );
    openMenu();
    assert.equal(active()?.textContent, "About");
    assert.equal(active()?.closest("#mobile-nav-panel"), panel());
  });

  test("the Tab cycle is exactly the visible header controls, in DOM order", () => {
    openMenu();
    assert.deepEqual(getTabbableElements(header()).map(label), EXPECTED_CYCLE);
    // Nothing from the desktop-only nav or CTA, nothing from the page.
    assert.equal(
      getTabbableElements(header()).some((e) =>
        e.classList.contains("desktop"),
      ),
      false,
    );
  });

  test("Tab wraps from the last control to the first; Tabs in between are left to the browser", () => {
    openMenu();
    $("panel-cta").focus();
    assert.equal(press("Tab"), true, "wrap is handled by the trap");
    assert.equal(active(), $("logo"));

    $("logo").focus();
    assert.equal(
      press("Tab"),
      false,
      "no wrap needed: browser default moves focus",
    );
    assert.equal(active(), $("logo"));
  });

  test("Shift+Tab wraps from the first control to the last", () => {
    openMenu();
    $("logo").focus();
    assert.equal(press("Tab", true), true);
    assert.equal(active(), $("panel-cta"));

    $("toggle").focus();
    assert.equal(
      press("Tab", true),
      false,
      "toggle → logo is the browser's job",
    );
  });

  test("a Tab from outside the trapped region re-enters at the first control", () => {
    openMenu();
    (document.body as HTMLElement).focus();
    $("main-link").focus(); // e.g. a stray programmatic focus
    assert.equal(press("Tab"), true);
    assert.equal(active(), $("logo"));
  });

  test("Escape closes the menu and returns focus to the toggle", () => {
    openMenu();
    assert.equal(active()?.textContent, "About");
    assert.equal(press("Escape"), true);
    assert.equal(escapes, 1);
    assert.equal(active(), toggle());
    assert.equal(panel().classList.contains("hidden"), true);
    assert.equal(toggle().getAttribute("aria-expanded"), "false");
    // Released: the document listener is gone, Tab is the browser's again.
    $("panel-cta").focus();
    assert.equal(press("Tab"), false);
    assert.equal(press("Escape"), false);
  });

  test("closing by any path (backdrop, link) restores focus to the toggle", () => {
    openMenu();
    $("panel-cta").focus();
    closeMenu();
    assert.equal(active(), toggle());
  });

  test("everything behind the menu is inert while open and released on close", () => {
    $("footer").setAttribute("inert", "");
    openMenu();
    for (const id of ["skip", "main-content", "footer"]) {
      assert.equal($(id).hasAttribute("inert"), true, `${id} is inert`);
    }
    assert.equal(header().hasAttribute("inert"), false);
    assert.equal(
      $("jsonld").hasAttribute("inert"),
      true,
      "scripts are harmless to mark",
    );

    closeMenu();
    for (const id of ["skip", "main-content", "jsonld"]) {
      assert.equal($(id).hasAttribute("inert"), false, `${id} released`);
    }
    assert.equal(
      $("footer").hasAttribute("inert"),
      true,
      "pre-existing inert is preserved",
    );
  });

  test("a stale-open state at desktop width never freezes the keyboard", () => {
    openMenu();
    // The viewport crosses xl: toggle and panel resolve to hidden, the
    // desktop nav and CTA become visible. The cycle simply continues over
    // what is visible (the Navbar's media-query effect releases the trap).
    toggle().classList.add("hidden");
    panel().classList.add("hidden");
    header().querySelector("nav")?.classList.remove("hidden");
    $("desktop-cta").classList.remove("hidden");
    $("desktop-cta").focus();
    assert.equal(press("Tab"), true);
    assert.equal(active(), $("logo"));

    // Nothing visible at all: the trap steps aside rather than swallowing
    // every Tab.
    $("logo").classList.add("hidden");
    header().querySelector("nav")?.classList.add("hidden");
    $("desktop-cta").classList.add("hidden");
    assert.equal(press("Tab"), false);
    assert.equal(press("Tab", true), false);
  });
});

describe("getTabbableElements", () => {
  test("skips disabled controls, tabindex=-1, and hidden subtrees", () => {
    document.body.innerHTML = `
      <div id="root">
        <a id="a" href="/x">x</a>
        <a>no href</a>
        <button id="b" type="button">b</button>
        <button disabled type="button">d</button>
        <span id="s" tabindex="0">s</span>
        <span tabindex="-1">no</span>
        <div class="hidden"><a href="/h">hidden</a></div>
        <input id="i" type="email" />
      </div>`;
    assert.deepEqual(
      getTabbableElements($("root")).map((e) => e.id),
      ["a", "b", "s", "i"],
    );
  });
});
