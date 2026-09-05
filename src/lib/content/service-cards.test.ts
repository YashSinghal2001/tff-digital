import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { wpServiceOfferingFixture } from "../../../test/fixtures/wp-content.ts";
import { adaptServiceOffering } from "../../adapters/service-offering.adapter.ts";
import { toServiceCardItems } from "./service-cards.ts";

// The narrow shape that crosses into the client-side grids: the link is
// derived from the WordPress slug and nothing from Yoast/CMS media leaks.

describe("toServiceCardItems", () => {
  const service = adaptServiceOffering(wpServiceOfferingFixture);

  test("derives the detail link from the WordPress slug", () => {
    const [card] = toServiceCardItems([service]);
    assert.equal(card.href, "/services/search-engine-optimization");
    assert.equal(card.title, "Search Engine Optimization");
    assert.equal(card.summary, "Rank higher.");
    assert.deepEqual(card.features, [
      "Technical SEO",
      "On-Page SEO",
      "Local SEO",
    ]);
  });

  test("carries only presentation fields — no seo, content, or media", () => {
    const [card] = toServiceCardItems([service]);
    assert.deepEqual(Object.keys(card).sort(), [
      "features",
      "href",
      "id",
      "slug",
      "summary",
      "title",
    ]);
    assert.doesNotMatch(JSON.stringify(card), /cms\./);
  });

  test("caps features on the server when a limit is given", () => {
    const [capped] = toServiceCardItems([service], { featureLimit: 2 });
    assert.deepEqual(capped.features, ["Technical SEO", "On-Page SEO"]);
    const [uncapped] = toServiceCardItems([service]);
    assert.equal(uncapped.features.length, 3);
  });

  test("preserves the incoming order and count", () => {
    const cards = toServiceCardItems([
      { ...service, id: "a", slug: "first" },
      { ...service, id: "b", slug: "second" },
    ]);
    assert.deepEqual(
      cards.map((c) => c.slug),
      ["first", "second"],
    );
  });
});
