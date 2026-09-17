import assert from "node:assert/strict";
import test, { describe } from "node:test";
import { readFileSync } from "node:fs";

// Service-specific CMS HTML (ACF `custom_html_content`) takes over the
// content slot on the service detail page when present; the existing
// content/description rendering (post content, falling back to the ACF
// description via the adapter) is the fallback otherwise — never both.

const SERVICE_DETAIL_PAGE = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");

describe("service detail page custom HTML fallback wiring", () => {
  test("renders customHtmlContent through ArticleContent when present", () => {
    assert.match(
      SERVICE_DETAIL_PAGE,
      /service\.customHtmlContent \?[\s\S]*?<ArticleContent html=\{service\.customHtmlContent\}/,
    );
  });

  test("falls back to the existing service.content rendering, unchanged", () => {
    assert.match(
      SERVICE_DETAIL_PAGE,
      /: service\.content \?[\s\S]*?<ArticleContent html=\{service\.content\}/,
    );
  });

  test("renders exactly one ArticleContent for the content slot (mutually exclusive branches)", () => {
    assert.equal(SERVICE_DETAIL_PAGE.match(/<ArticleContent html=\{/g)?.length, 2);
  });
});
