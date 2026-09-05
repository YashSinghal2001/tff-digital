import assert from "node:assert/strict";
import test, { describe } from "node:test";

// Explicit .ts extension: this file runs under `node --test` (native type
// stripping, real ESM resolution), not through the Next bundler.
import { wpMenuQueryResultSchema } from "./wp-menu.schema.ts";
import type { WPMenuItem, WPMenuQueryResult } from "@/types/api/wp-menu";

// Inline fixture mirroring the GetMenuByLocation selection: three nested
// nodes-only connections (menus → menuItems → childItems), typed against
// the interfaces so fixture and contract cannot drift (audit CQ-1).

const child: WPMenuItem = {
  id: "bWVudUl0ZW06Mg==",
  label: "SEO",
  url: "/services/aeo-seo",
  target: null,
};

const parent: WPMenuItem = {
  id: "bWVudUl0ZW06MQ==",
  label: "Services",
  url: "/services",
  target: "_self",
  childItems: { nodes: [child] },
};

const validResult: WPMenuQueryResult = {
  menus: { nodes: [{ name: "Primary", menuItems: { nodes: [parent] } }] },
};

describe("wpMenuQueryResultSchema", () => {
  test("accepts a well-formed nested menu response and returns it deep-equal", () => {
    assert.deepEqual(wpMenuQueryResultSchema.parse(validResult), validResult);
  });

  test("accepts null childItems, an item with no childItems key, and null target", () => {
    const shape: WPMenuQueryResult = {
      menus: {
        nodes: [
          {
            name: "Primary",
            menuItems: {
              nodes: [
                { ...parent, childItems: null },
                { id: "3", label: "Blog", url: "/blog", target: null },
              ],
            },
          },
        ],
      },
    };
    assert.deepEqual(wpMenuQueryResultSchema.parse(shape), shape);
  });

  test("accepts empty nodes at every level", () => {
    const noMenus: WPMenuQueryResult = { menus: { nodes: [] } };
    assert.deepEqual(wpMenuQueryResultSchema.parse(noMenus), noMenus);

    const noItems: WPMenuQueryResult = {
      menus: { nodes: [{ name: "Primary", menuItems: { nodes: [] } }] },
    };
    assert.deepEqual(wpMenuQueryResultSchema.parse(noItems), noItems);

    const noChildren: WPMenuQueryResult = {
      menus: {
        nodes: [
          {
            name: "Primary",
            menuItems: { nodes: [{ ...parent, childItems: { nodes: [] } }] },
          },
        ],
      },
    };
    assert.deepEqual(wpMenuQueryResultSchema.parse(noChildren), noChildren);
  });

  test("rejects a connection returned without .nodes at each level (the PARTIAL-1 shape)", () => {
    const atRoot = wpMenuQueryResultSchema.safeParse({ menus: {} });
    assert.equal(atRoot.success, false);
    assert.deepEqual(atRoot.error?.issues[0]?.path, ["menus", "nodes"]);

    const atItems = wpMenuQueryResultSchema.safeParse({
      menus: { nodes: [{ name: "Primary", menuItems: {} }] },
    });
    assert.equal(atItems.success, false);
    assert.deepEqual(atItems.error?.issues[0]?.path, [
      "menus",
      "nodes",
      0,
      "menuItems",
      "nodes",
    ]);

    const atChildren = wpMenuQueryResultSchema.safeParse({
      menus: {
        nodes: [
          {
            name: "Primary",
            menuItems: { nodes: [{ ...parent, childItems: {} }] },
          },
        ],
      },
    });
    assert.equal(atChildren.success, false);
    assert.deepEqual(atChildren.error?.issues[0]?.path.slice(-2), [
      "childItems",
      "nodes",
    ]);
  });

  test("rejects a response missing the menus field entirely", () => {
    const result = wpMenuQueryResultSchema.safeParse({});
    assert.equal(result.success, false);
    assert.deepEqual(result.error?.issues[0]?.path, ["menus"]);
  });

  test("rejects a required item field gone missing (url absent) and a wrong type (label)", () => {
    const clone = structuredClone(validResult);
    delete (clone.menus.nodes[0].menuItems.nodes[0] as Partial<WPMenuItem>).url;
    const missing = wpMenuQueryResultSchema.safeParse(clone);
    assert.equal(missing.success, false);
    assert.equal(missing.error?.issues[0]?.path.at(-1), "url");

    const wrongType = wpMenuQueryResultSchema.safeParse({
      menus: {
        nodes: [
          { name: "Primary", menuItems: { nodes: [{ ...parent, label: 1 }] } },
        ],
      },
    });
    assert.equal(wrongType.success, false);
    assert.equal(wrongType.error?.issues[0]?.code, "invalid_type");
    assert.equal(wrongType.error?.issues[0]?.path.at(-1), "label");
  });

  test("rejects nodes that is not an array", () => {
    const result = wpMenuQueryResultSchema.safeParse({
      menus: { nodes: "not-an-array" },
    });
    assert.equal(result.success, false);
    assert.equal(result.error?.issues[0]?.code, "invalid_type");
  });

  test("strips unknown extra fields instead of failing or passing them through", () => {
    const parsed = wpMenuQueryResultSchema.parse({
      menus: {
        nodes: [
          {
            name: "Primary",
            slug: "primary",
            menuItems: { nodes: [{ ...parent, cssClasses: [] }] },
          },
        ],
        pageInfo: { hasNextPage: false },
      },
    });
    assert.deepEqual(parsed, validResult);
  });
});
