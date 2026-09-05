import assert from "node:assert/strict";
import test, { describe } from "node:test";

import { wpServiceOfferingFixture } from "../../test/fixtures/wp-content.ts";
import {
  adaptServiceOffering,
  parseServiceFeatures,
} from "./service-offering.adapter.ts";

// The WordPress → domain boundary for services: the ACF `features` textarea
// becomes the bullet list the homepage and /services cards render (ARCH-1).

describe("parseServiceFeatures", () => {
  test("splits CRLF and LF lines, trims, and drops empty lines", () => {
    assert.deepEqual(
      parseServiceFeatures(
        "Technical SEO\r\n  On-Page SEO \r\n\r\nLocal SEO\n",
      ),
      ["Technical SEO", "On-Page SEO", "Local SEO"],
    );
  });

  test("yields an empty list for null, undefined, or blank input", () => {
    assert.deepEqual(parseServiceFeatures(null), []);
    assert.deepEqual(parseServiceFeatures(undefined), []);
    assert.deepEqual(parseServiceFeatures("  \r\n \n"), []);
  });
});

describe("adaptServiceOffering", () => {
  test("maps the ACF field group, including features and display order", () => {
    const service = adaptServiceOffering(wpServiceOfferingFixture);
    assert.equal(service.slug, "search-engine-optimization");
    assert.equal(service.summary, "Rank higher.");
    assert.equal(service.order, 1);
    assert.deepEqual(service.features, [
      "Technical SEO",
      "On-Page SEO",
      "Local SEO",
    ]);
  });

  test("tolerates a missing field group", () => {
    const service = adaptServiceOffering({
      ...wpServiceOfferingFixture,
      serviceFields: null,
    });
    assert.deepEqual(service.features, []);
    assert.equal(service.order, null);
    assert.equal(service.summary, "");
  });
});
