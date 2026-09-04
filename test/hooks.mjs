// Module-resolution hooks for the test runner (see register.mjs). Node's
// native type stripping runs the .ts sources directly, but three things the
// Next.js bundler normally provides are missing at plain-Node runtime:
//
//   1. the `@/*` path alias from tsconfig.json → resolved to ./src/*, trying
//      the extensions Next allows source files to omit;
//   2. `import "server-only"` → the real package throws on import outside a
//      React Server Component build, so it resolves to an empty module here
//      (the guard is a build-time contract, not runtime behaviour under test);
//   3. bare `next/<entry>` specifiers (next/server, next/headers, ...) → the
//      `next` package ships no "exports" map, so plain Node needs the `.js`.
//      Single-segment entries only; `next/font/google` and friends live in
//      .tsx layouts, which this runner cannot load anyway.
//
// Out of scope by design: .tsx components/pages and .css imports — Node's
// type stripping does not transform JSX, so component tests would need a
// separate transform. Nothing here rewrites module contents; every import
// still loads the real source file it names.
import { statSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const SRC_ROOT = new URL("../src/", import.meta.url);
const EMPTY_MODULE = "data:text/javascript,";
const SOURCE_EXTENSIONS = ["", ".ts", "/index.ts"];

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: EMPTY_MODULE, shortCircuit: true, format: "module" };
  }

  if (specifier.startsWith("@/")) {
    const base = fileURLToPath(new URL(specifier.slice(2), SRC_ROOT));
    for (const extension of SOURCE_EXTENSIONS) {
      if (isFile(base + extension)) {
        return nextResolve(pathToFileURL(base + extension).href, context);
      }
    }
    throw new Error(
      `Cannot resolve "${specifier}" under src/ (tried ${SOURCE_EXTENSIONS.map((extension) => `"${extension}"`).join(", ")} from ${context.parentURL})`,
    );
  }

  if (/^next\/[\w-]+$/.test(specifier)) {
    return nextResolve(`${specifier}.js`, context);
  }

  return nextResolve(specifier, context);
}
