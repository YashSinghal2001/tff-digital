import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler. This adapter
// is testable here precisely because it has only type-only imports.
import { adaptNavigationMenu } from "./navigation.adapter.ts";
import type { WPMenu } from "@/types/api/wp-menu";

/**
 * Builds the malformed-but-valid-GraphQL responses PARTIAL-1 is about: a
 * connection object that exists but has no `.nodes`. The WPMenu type says
 * this cannot happen, which is the whole point — the type is an unvalidated
 * assertion about WordPress's response, not a guarantee (audit CQ-1).
 */
const asMenu = (shape: unknown) => shape as WPMenu;

const wellFormed = asMenu({
  name: "Primary",
  menuItems: {
    nodes: [
      {
        id: "1",
        label: "About",
        url: "/about",
        target: null,
        childItems: { nodes: [] },
      },
    ],
  },
});

describe("adaptNavigationMenu", () => {
  test("adapts a well-formed menu unchanged", () => {
    const menu = adaptNavigationMenu(wellFormed);
    assert.equal(menu.name, "Primary");
    assert.equal(menu.items.length, 1);
    assert.deepEqual(menu.items[0], {
      id: "1",
      label: "About",
      url: "/about",
      target: "_self",
      children: [],
    });
  });

  test("survives a menuItems connection returned without .nodes", () => {
    // Before PARTIAL-1's fix this threw:
    // TypeError: Cannot read properties of undefined (reading 'map')
    const menu = adaptNavigationMenu(
      asMenu({ name: "Primary", menuItems: {} }),
    );
    assert.deepEqual(menu.items, []);
  });

  test("survives menuItems missing entirely", () => {
    const menu = adaptNavigationMenu(asMenu({ name: "Primary" }));
    assert.deepEqual(menu.items, []);
  });

  test("survives a nested childItems connection returned without .nodes", () => {
    const menu = adaptNavigationMenu(
      asMenu({
        name: "Primary",
        menuItems: {
          nodes: [
            {
              id: "1",
              label: "Services",
              url: "/services",
              target: null,
              childItems: {},
            },
          ],
        },
      }),
    );
    assert.deepEqual(menu.items[0].children, []);
  });

  test("still treats an explicitly null childItems as no children", () => {
    // Pre-existing behaviour the fix must not change: `null` was already
    // handled safely, only a present-but-shapeless connection was not.
    const menu = adaptNavigationMenu(
      asMenu({
        name: "Primary",
        menuItems: {
          nodes: [
            {
              id: "1",
              label: "Blog",
              url: "/blog",
              target: "_blank",
              childItems: null,
            },
          ],
        },
      }),
    );
    assert.deepEqual(menu.items[0].children, []);
    assert.equal(menu.items[0].target, "_blank");
  });

  test("adapts an empty menuItems.nodes to no items", () => {
    const menu = adaptNavigationMenu(
      asMenu({ name: "Primary", menuItems: { nodes: [] } }),
    );
    assert.deepEqual(menu.items, []);
  });
});
