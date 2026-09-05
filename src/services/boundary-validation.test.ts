import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe, mock } from "node:test";
import { ZodError } from "zod";

// The last two GraphQL repositories to gain the CQ-1 boundary parse
// (content pages and navigation). Real repository → service → adapter with
// only fetch mocked: a well-formed reply adapts into the domain shape, a
// not-found reply stays null, and a malformed reply becomes the typed
// WordPressError(kind "parse") every other boundary already produces —
// never a raw ZodError or a stray TypeError from deeper in the app.
process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";
process.env.WORDPRESS_USE_MOCK_DATA = "";

const { getPageBySlug } = await import("./content-page.service.ts");
const { getNavigationMenu } = await import("./navigation.service.ts");
const { WordPressError } = await import("../lib/wordpress/errors.ts");

const replyWith = (data: unknown) =>
  mock.method(globalThis, "fetch", async () => Response.json({ data }));

const isParseError = (error: unknown) =>
  error instanceof WordPressError &&
  error.kind === "parse" &&
  !(error instanceof ZodError);

const validPage = {
  id: "cGFnZTox",
  slug: "about",
  title: "About",
  content: "<p>About us.</p><script>alert(1)</script>",
  featuredImage: null,
  seo: null,
};

const validMenus = {
  menus: {
    nodes: [
      {
        name: "Primary",
        menuItems: {
          nodes: [
            {
              id: "1",
              label: "Services",
              url: "/services",
              target: "_blank",
              childItems: {
                nodes: [
                  {
                    id: "2",
                    label: "SEO",
                    url: "/services/aeo-seo",
                    target: null,
                  },
                ],
              },
            },
          ],
        },
      },
    ],
  },
};

describe("WordPress boundary validation — content pages and navigation (CQ-1)", () => {
  beforeEach(() => {
    mock.method(console, "error", () => {});
  });
  afterEach(() => mock.restoreAll());

  test("a well-formed page reply flows through the parse and adapter", async () => {
    replyWith({ page: validPage });
    const page = await getPageBySlug("about");
    assert.equal(page?.slug, "about");
    assert.equal(page?.content, "<p>About us.</p>");
    assert.equal(page?.featuredImage, null);
  });

  test("a null page (unknown slug) stays null", async () => {
    replyWith({ page: null });
    assert.equal(await getPageBySlug("nope"), null);
  });

  test("a malformed page reply throws WordPressError kind 'parse'", async () => {
    replyWith({ page: { ...validPage, title: 42 } });
    await assert.rejects(getPageBySlug("about"), isParseError);
    replyWith({});
    await assert.rejects(getPageBySlug("about"), isParseError);
  });

  test("a well-formed menu reply adapts into the navigation domain shape", async () => {
    replyWith(validMenus);
    const menu = await getNavigationMenu();
    assert.equal(menu?.name, "Primary");
    assert.deepEqual(menu?.items, [
      {
        id: "1",
        label: "Services",
        url: "/services",
        target: "_blank",
        children: [
          {
            id: "2",
            label: "SEO",
            url: "/services/aeo-seo",
            target: "_self",
            children: [],
          },
        ],
      },
    ]);
  });

  test("empty menus.nodes (no menu at that location) resolves to null", async () => {
    replyWith({ menus: { nodes: [] } });
    assert.equal(await getNavigationMenu(), null);
  });

  test("a menu connection without .nodes is a parse error at the boundary, not a TypeError", async () => {
    // Before CQ-1 this reached `menus.nodes[0]` in the service and threw
    // "Cannot read properties of undefined (reading '0')".
    replyWith({ menus: {} });
    await assert.rejects(getNavigationMenu(), isParseError);
    replyWith({ menus: { nodes: [{ name: "Primary", menuItems: {} }] } });
    await assert.rejects(getNavigationMenu(), isParseError);
  });
});
