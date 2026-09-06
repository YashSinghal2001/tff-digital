import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// META-1: these three not-found.tsx files had no metadata export at all, so
// a nonexistent blog post/category/tag slug rendered with the root layout's
// bare "TFF Digital" <title> instead of signaling "not found" — unlike the
// root app/not-found.tsx and every other 404 boundary in the app, which all
// set a page-specific title. Page files contain JSX and cannot be imported
// under this repo's `node --test` runner (see perf4-dedup-contract.test.ts),
// so the contract is read from source, same as that file.
const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), "utf8");

const routes: [string, string][] = [
  ["./[slug]/not-found.tsx", "Article not found"],
  ["./category/[slug]/not-found.tsx", "Category not found"],
  ["./tag/[slug]/not-found.tsx", "Tag not found"],
];

describe("blog family not-found pages set a page-specific title (META-1)", () => {
  for (const [path, title] of routes) {
    test(`${path} declares title: "${title}"`, () => {
      const source = readSource(path);
      assert.match(source, new RegExp(`title: "${title}"`));
    });
  }
});
