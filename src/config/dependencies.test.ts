import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// DEP-1: originally 4 HIGH npm audit findings (nanoid, postcss x2, sharp).
// nanoid was a free, isolated, non-breaking bump (61fbc6b). The remaining
// postcss and sharp findings were NOT independently fixable on the Next.js
// 15 line — both resolved to copies `next` itself pinned (an exact-version
// "postcss": "8.4.31" with no range, and its own `sharp` optionalDependency)
// — `npm audit`'s own `fixAvailable` named next@16.3.4 (isSemVerMajor: true)
// as the only remedy for all three. That upgrade shipped as DEP-1's final
// piece: next 15.5.22 -> 16.3.4, which moved next's own postcss pin to
// 8.5.23 (patched) and its sharp range to ^0.35.4 (patched). `npm audit`
// now reports zero vulnerabilities.
//
// This file has two jobs: keep the nanoid fix from silently regressing, and
// keep the postcss/sharp fix pinned to versions outside the vulnerable
// ranges (postcss <=8.5.22, sharp <0.35.0) so a future lockfile change
// can't silently reintroduce either advisory.
const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

const LOCKFILE = JSON.parse(
  readFileSync(path.join(ROOT, "package-lock.json"), "utf8"),
) as { packages: Record<string, { version?: string }> };

function versionAtLeast(actual: string, minimum: string): boolean {
  const a = actual.split(".").map(Number);
  const m = minimum.split(".").map(Number);
  for (let i = 0; i < Math.max(a.length, m.length); i++) {
    const diff = (a[i] ?? 0) - (m[i] ?? 0);
    if (diff !== 0) return diff > 0;
  }
  return true;
}

function lockedVersion(nodeModulesPath: string): string {
  const entry = LOCKFILE.packages[nodeModulesPath];
  assert.ok(
    entry?.version,
    `${nodeModulesPath} not found in package-lock.json`,
  );
  return entry.version;
}

describe("DEP-1 — nanoid fix stays applied", () => {
  test("the one resolved nanoid copy is >= 3.3.18 (GHSA-2v37-7h3g-55p8)", () => {
    // Both postcss instances resolve to this single deduped copy — confirmed
    // via `npm ls nanoid`, which shows next's bundled postcss and
    // @tailwindcss/postcss's own postcss sharing one nanoid entry.
    const version = lockedVersion("node_modules/nanoid");
    assert.ok(
      versionAtLeast(version, "3.3.18"),
      `node_modules/nanoid is ${version}, expected >= 3.3.18`,
    );
  });
});

describe("DEP-1 — postcss/sharp fixed via the Next 16 upgrade", () => {
  test("next is on the 16.x line that carries the patched postcss/sharp", () => {
    const version = lockedVersion("node_modules/next");
    assert.equal(
      version.startsWith("16."),
      true,
      `next is ${version}, not 16.x — DEP-1's postcss/sharp fix depends on ` +
        "next's own bundled versions of those packages. Re-run `npm audit` " +
        "before assuming this is still fixed.",
    );
  });

  test("next's nested postcss copy is outside the vulnerable range (<=8.5.22)", () => {
    // Not the top-level postcss (8.5.25, healthy) that @tailwindcss/postcss
    // and sanitize-html use — the one nested under next/node_modules, which
    // next's own package.json still pins by exact version, so npm can never
    // dedupe or independently bump it; only a next release can move it.
    const nextPackageJson = JSON.parse(
      readFileSync(path.join(ROOT, "node_modules/next/package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> };
    const declared = nextPackageJson.dependencies?.postcss;
    const locked = lockedVersion("node_modules/next/node_modules/postcss");
    assert.equal(
      declared,
      locked,
      "next's declared and locked postcss diverge",
    );
    assert.ok(
      declared && versionAtLeast(declared, "8.5.23"),
      `next's nested postcss is ${declared}, still within the vulnerable <=8.5.22 range`,
    );
  });

  test("sharp remains next's own optional dependency, at a patched version", () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(ROOT, "package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    assert.equal(packageJson.dependencies?.sharp, undefined);
    assert.equal(packageJson.devDependencies?.sharp, undefined);
    const version = lockedVersion("node_modules/sharp");
    assert.ok(
      versionAtLeast(version, "0.35.0"),
      `node_modules/sharp is ${version}, still within the vulnerable <0.35.0 range`,
    );
  });
});
