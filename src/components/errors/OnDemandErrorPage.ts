import { Fragment, createElement as h, type CSSProperties } from "react";
import Head from "next/head";
import { siteConfig } from "@/config/site.config";
import { ROUTES } from "@/constants/routes";

/**
 * Branded fallback for the one failure path no App Router boundary can
 * reach (audit OUTAGE-2): a throw during ON-DEMAND static generation of a
 * detail slug that was not prerendered by the last build (content published
 * between deploys, or a build that ran during a CMS outage) while WordPress
 * is unreachable. Next 15 fails that render outright — no error.tsx, root or
 * segment, ever mounts, and opting the failed render into dynamic rendering
 * (`connection()`) is rejected as DYNAMIC_SERVER_USAGE — and answers with
 * the Pages Router's `_error` document instead. src/pages/_error.ts exports
 * this component as that document, so the visitor sees the site's own error
 * page, not Next's unstyled "500 Internal Server Error" text. The response
 * stays a correct, uncached 500. Dynamic-route failures still reach
 * src/app/error.tsx as before.
 *
 * Deliberately self-contained (inline styles, no design-system imports,
 * no JSX): it renders outside the app layout, so app/globals.css is not
 * loaded, and the JSX-free module lets `node --test` render it directly
 * (native type stripping cannot transform JSX). It lives here rather than
 * in src/pages because Next treats every file in that directory as a page,
 * its test included. Nothing from `err` is ever rendered — no message,
 * stack, or CMS URL can reach the visitor.
 */

interface ErrorPageProps {
  statusCode?: number;
}

const page: CSSProperties = {
  margin: 0,
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  gap: "16px",
  padding: "24px",
  textAlign: "center",
  background: "#0C1025",
  color: "#FFFFFF",
  fontFamily: "system-ui, sans-serif",
};

const button: CSSProperties = {
  display: "inline-block",
  padding: "10px 24px",
  borderRadius: "9999px",
  border: "none",
  fontSize: "14px",
  fontWeight: 600,
  lineHeight: "20px",
  cursor: "pointer",
  textDecoration: "none",
};

export default function OnDemandErrorPage({ statusCode }: ErrorPageProps) {
  return h(
    Fragment,
    null,
    // next/head is the Pages Router's own head channel (the App Router's
    // metadata API does not apply to this document). The title mirrors the
    // root layout's "%s | site" template and the robots meta mirrors
    // src/app/not-found.tsx — a failure state must never be indexed.
    h(
      Head,
      null,
      h("title", null, `Something went wrong | ${siteConfig.name}`),
      h("meta", { name: "robots", content: "noindex, nofollow" }),
    ),
    h("main", { style: page }, ...content(statusCode)),
  );
}

function content(statusCode: number | undefined) {
  return [
    h(
      "p",
      {
        style: {
          margin: 0,
          fontSize: "12px",
          letterSpacing: "0.2em",
          color: "#3882F6",
        },
      },
      statusCode ? `— ERROR ${statusCode}` : "— ERROR",
    ),
    h(
      "h1",
      { style: { fontSize: "28px", fontWeight: 700, margin: 0 } },
      "Something went wrong.",
    ),
    h(
      "p",
      {
        style: {
          color: "#D8D8D8",
          maxWidth: "420px",
          fontSize: "14px",
          margin: 0,
        },
      },
      "We hit an unexpected error loading this page. Try again, or head back home.",
    ),
    h(
      "div",
      {
        style: {
          marginTop: "8px",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "16px",
        },
      },
      h(
        "button",
        {
          type: "button",
          // A full reload re-attempts the on-demand render; there is no
          // App Router boundary here to reset.
          onClick: () => window.location.reload(),
          style: {
            ...button,
            background: "linear-gradient(90deg, #3882F6 0%, #8B5CF6 100%)",
            color: "#FFFFFF",
          },
        },
        "Try again",
      ),
      h(
        "a",
        {
          href: ROUTES.home,
          style: {
            ...button,
            border: "1px solid rgba(255,255,255,0.4)",
            background: "transparent",
            color: "#FFFFFF",
          },
        },
        "Back to home",
      ),
    ),
  ];
}

// Present for the Pages Router contract; the on-demand fallback path above
// renders without running it, so the page never depends on statusCode.
OnDemandErrorPage.getInitialProps = ({
  res,
  err,
}: {
  res?: { statusCode: number };
  err?: { statusCode?: number } | null;
}): ErrorPageProps => ({
  statusCode: res?.statusCode ?? err?.statusCode ?? 500,
});
