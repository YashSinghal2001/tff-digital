// Entry point for `npm test` (`node --import ./test/register.mjs --test ...`).
// Installs the module-resolution hooks in ./hooks.mjs before any test file
// loads, so tests can import real production modules — including the
// server-only services, repositories and route handlers — without a bundler.
import { register } from "node:module";

// Node 26 flags module.register() as deprecated (DEP0205) in favour of the
// synchronous registerHooks(); keep register() — it is what Node 22, the
// minimum this runner supports, provides.
register("./hooks.mjs", import.meta.url);
