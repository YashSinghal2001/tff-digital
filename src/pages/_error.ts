// The Pages Router's error document, which Next serves for the one failure
// path no App Router boundary can reach (audit OUTAGE-2). The component and
// its rationale live in src/components/errors/OnDemandErrorPage.ts — nothing
// else may sit in src/pages, since every file here is treated as a page.
export { default } from "@/components/errors/OnDemandErrorPage";
