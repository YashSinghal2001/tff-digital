import assert from "node:assert/strict";
import test, { describe } from "node:test";

import {
  wpCaseStudyFixture,
  wpServiceOfferingFixture,
} from "../../test/fixtures/wp-content.ts";
import { adaptCaseStudy } from "./case-study.adapter.ts";
import type { WPCaseStudyFields } from "@/types/api/wp-case-study";

// The WordPress → domain boundary for case studies: the fixed four
// label/value result pairs, the ACF free-text fields that reach
// dangerouslySetInnerHTML (ARCH-5), and the nested related services.

describe("adaptCaseStudy", () => {
  test("keeps only result pairs that have both a label and a value, in order", () => {
    assert.deepEqual(adaptCaseStudy(wpCaseStudyFixture).results, [
      { label: "Traffic", value: "+120%" },
      { label: "Rankings", value: "Top 3" },
    ]);
  });

  test("sanitizes challenge and solution before they can reach the page", () => {
    const caseStudy = adaptCaseStudy({
      ...wpCaseStudyFixture,
      caseStudyFields: {
        ...wpCaseStudyFixture.caseStudyFields!,
        challenge: '<p onclick="alert(1)">Hard.</p><script>alert(1)</script>',
        solution: '<p>Fixed.</p><iframe src="javascript:alert(1)"></iframe>',
      },
    });
    assert.equal(caseStudy.challenge, "<p>Hard.</p>");
    // Wiring only — the policy itself is pinned in sanitize-wp-html.test.ts.
    assert.doesNotMatch(caseStudy.solution, /javascript:/);
    assert.match(caseStudy.solution, /<p>Fixed\.<\/p>/);
  });

  test("maps the field group, media and related services into the domain shape", () => {
    const caseStudy = adaptCaseStudy(wpCaseStudyFixture);
    assert.equal(caseStudy.clientName, "ChicaBebo");
    assert.equal(caseStudy.projectUrl, "https://chicabebo.nl");
    assert.equal(caseStudy.summary, "Short summary.");
    assert.equal(caseStudy.featuredOnHomepage, true);
    assert.deepEqual(caseStudy.featuredImage, {
      id: "bWVkaWE6MQ==",
      url: "https://cms.example.test/wp-content/uploads/hero.jpg",
      altText: "Hero",
      width: 1600,
      height: 900,
    });
    assert.equal(caseStudy.relatedServices.length, 1);
    assert.equal(
      caseStudy.relatedServices[0].slug,
      "search-engine-optimization",
    );
    assert.equal(
      caseStudy.relatedServices[0].content,
      "<p>Full service description.</p>",
    );
    assert.equal(caseStudy.seo?.description, "Short summary.");
  });

  test("a missing ACF field group degrades to empty values, not a crash (PARTIAL-1)", () => {
    const caseStudy = adaptCaseStudy({
      ...wpCaseStudyFixture,
      caseStudyFields: null,
      featuredImage: null,
      excerpt: null,
      content: null,
    });
    assert.equal(caseStudy.challenge, "");
    assert.equal(caseStudy.solution, "");
    assert.equal(caseStudy.projectUrl, null);
    assert.equal(caseStudy.featuredOnHomepage, false);
    assert.deepEqual(caseStudy.results, []);
    assert.deepEqual(caseStudy.relatedServices, []);
    assert.equal(caseStudy.featuredImage, null);
    assert.equal(caseStudy.seo?.description, "");
  });

  test("relatedServices: null, a connection without .nodes, and empty nodes all yield [] (PARTIAL-1)", () => {
    const withRelated = (relatedServices: unknown) =>
      adaptCaseStudy({
        ...wpCaseStudyFixture,
        caseStudyFields: {
          ...wpCaseStudyFixture.caseStudyFields!,
          relatedServices:
            relatedServices as WPCaseStudyFields["relatedServices"],
        },
      }).relatedServices;

    assert.deepEqual(withRelated(null), []);
    // Present-but-shapeless connection: the case PARTIAL-1 is about.
    assert.deepEqual(withRelated({}), []);
    assert.deepEqual(withRelated({ nodes: [] }), []);
    // Populated nodes still adapt through the service adapter.
    assert.equal(
      withRelated({ nodes: [wpServiceOfferingFixture] })[0]?.slug,
      "search-engine-optimization",
    );
  });
});
