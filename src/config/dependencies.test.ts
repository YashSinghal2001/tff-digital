import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// DEP-1: 4 HIGH npm audit findings (nanoid, postcss x2, sharp). The
// nanoid copy both postcss instances pull in was a free, isolated,
// non-breaking bump (61fbc6b) and stays fixed here. The remaining postcss
// and sharp findings are NOT independently fixable: `npm audit` resolves
// both to a single nested copy that `next` itself pins by exact version
// (next/package.json declares "postcss": "8.4.31" with no range, and
// bundles its own `sharp` as an optionalDependency) — no patched release
// exists on the Next.js 15 line, and `npm audit`'s own `fixAvailable`
// field names next@16.3.4 (isSemVerMajor: true) as the only remedy for
// all three findings. The master audit's own recommended action for this
// portion is explicit: "schedule the major upgrade separately" — a
// framework major bump carries a blast radius (App Router conventions,
// ISR, next/image, every route this codebase's other closed audit items
// depend on) that does not belong inside a routine dependency-advisory
// fix, so it is deliberately deferred, not performed here.
//
// This file has two jobs: keep the nanoid fix from silently regressing,
// and make the deferred decision impossible to forget — if `next` is ever
// bumped past 15.x, the second describe block below fails on purpose so
// whoever did the bump re-runs `npm audit` and updates (or removes) this
// note, instead of it quietly going stale.
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

describe("DEP-1 — postcss/sharp remain deliberately deferred to the Next 16 upgrade", () => {
  test("next is still on the 15.x line this deferral was scoped against", () => {
    const version = lockedVersion("node_modules/next");
    assert.equal(
      version.startsWith("15."),
      true,
      `next is ${version}, not 15.x — DEP-1's postcss/sharp deferral was scoped ` +
        "against Next 15; a major bump may have already resolved (or changed) " +
        "these findings. Re-run `npm audit`, confirm, and update or remove this test.",
    );
  });

  test("the vulnerable postcss copy is next's own exact-pinned, nested dependency", () => {
    // Not the top-level postcss (8.5.25, healthy) that @tailwindcss/postcss
    // and sanitize-html use — the one nested under next/node_modules, which
    // next's own package.json pins to an exact version, so npm can never
    // dedupe or independently bump it.
    const nextPackageJson = JSON.parse(
      readFileSync(path.join(ROOT, "node_modules/next/package.json"), "utf8"),
    ) as { dependencies?: Record<string, string> };
    assert.equal(nextPackageJson.dependencies?.postcss, "8.4.31");
    assert.equal(
      lockedVersion("node_modules/next/node_modules/postcss"),
      "8.4.31",
    );
  });

  test("sharp remains next's own optional dependency, not this repo's", () => {
    const packageJson = JSON.parse(
      readFileSync(path.join(ROOT, "package.json"), "utf8"),
    ) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    assert.equal(packageJson.dependencies?.sharp, undefined);
    assert.equal(packageJson.devDependencies?.sharp, undefined);
    assert.equal(lockedVersion("node_modules/sharp"), "0.34.5");
  });
});
