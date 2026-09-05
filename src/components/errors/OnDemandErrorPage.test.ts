import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import OnDemandErrorPage from "./OnDemandErrorPage.ts";

// OUTAGE-2: the Pages Router _error document is what Next serves when an
// on-demand static render of a not-yet-prerendered detail slug throws
// during a CMS outage — no App Router boundary mounts on that path. This
// pins that the document is branded, offers the same recovery actions as
// src/app/error.tsx, never depends on props Next does not supply there,
// and cannot leak anything about the underlying error.

const render = (props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(OnDemandErrorPage, props));

describe("OnDemandErrorPage — pages/_error (OUTAGE-2 fallback document)", () => {
  test("renders the branded error copy with retry and home actions", () => {
    const html = render({ statusCode: 500 });
    assert.match(html, /— ERROR 500/);
    assert.match(html, /<h1[^>]*>Something went wrong\.<\/h1>/);
    assert.match(html, /Try again, or head back home\./);
    assert.match(html, /<button type="button"[^>]*>Try again<\/button>/);
    assert.match(html, /<a href="\/"[^>]*>Back to home<\/a>/);
  });

  test("renders outside Next's head manager (next/head is inert there) without throwing", () => {
    // The title and robots meta go through next/head, which only emits into
    // a real Pages Router document; here it must simply not break rendering.
    // Their presence in the served document is verified against a build.
    assert.match(render({ statusCode: 500 }), /^<main/);
  });

  test("renders without statusCode — the on-demand fallback path may supply none", () => {
    const html = render();
    assert.match(html, /— ERROR</);
    assert.doesNotMatch(html, /undefined|NaN/);
    assert.match(html, /Something went wrong\./);
  });

  test("never renders anything from the underlying error", () => {
    const secret =
      "Could not reach WPGraphQL at https://cms.tffdigital.com/graphql: fetch failed at /srv/app/node_modules/next/dist/server.js:1";
    const html = render({
      statusCode: 500,
      err: { message: secret, stack: secret, statusCode: 500 },
      title: secret,
    });
    assert.doesNotMatch(
      html,
      /cms\.tffdigital|graphql|fetch failed|node_modules|\.js:\d/i,
    );
  });

  test("getInitialProps prefers the response status, then the error's, then 500", () => {
    const gip = OnDemandErrorPage.getInitialProps;
    assert.deepEqual(
      gip({ res: { statusCode: 503 }, err: { statusCode: 500 } }),
      {
        statusCode: 503,
      },
    );
    assert.deepEqual(gip({ err: { statusCode: 404 } }), { statusCode: 404 });
    assert.deepEqual(gip({}), { statusCode: 500 });
    assert.deepEqual(gip({ err: null }), { statusCode: 500 });
  });
});
