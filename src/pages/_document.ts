// Next.js 16 fails to collect page data for a Pages Router `_error` page
// (used here for OUTAGE-2, see src/pages/_error.ts) unless a `_document`
// module is also present to require — it no longer falls back to its own
// bundled default silently. Re-exporting that same built-in default
// restores prior behavior with no visual/markup change.
export { default } from "next/document";
