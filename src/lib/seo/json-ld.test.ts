import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  buildOrganizationJsonLd,
  buildBlogPostingJsonLd,
  buildCaseStudyJsonLd,
  buildServiceJsonLd,
} from "@/lib/seo/json-ld";
import { siteConfig } from "@/config/site.config";
import type { Post } from "@/types/domain/post";
import type { CaseStudy } from "@/types/domain/case-study";
import type { ServiceOffering } from "@/types/domain/service-offering";

// JSONLD-1: buildBlogPostingJsonLd/buildCaseStudyJsonLd used to embed a full
// second copy of the Organization object (name/url/logo/sameAs) as their
// `publisher` field, duplicating the root layout's own Organization node
// (src/app/layout.tsx) on every blog post and case study page. Both now
// reference it by @id instead — the same pattern buildWebsiteJsonLd already
// used — so the full Organization body is emitted exactly once per page.

const ORG_ID = `${siteConfig.url}/#organization`;

const post: Post = {
  id: "1",
  databaseId: 1,
  slug: "test-post",
  title: "Test Post",
  excerpt: "An excerpt",
  content: "<p>Body</p>",
  publishedAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  featuredImage: null,
  author: null,
  categories: [],
  tags: [],
  seo: null,
};

const caseStudy: CaseStudy = {
  id: "1",
  slug: "test-case-study",
  title: "Test Case Study",
  excerpt: "An excerpt",
  content: "<p>Body</p>",
  summary: "A summary",
  challenge: "",
  solution: "",
  industry: "",
  clientName: "",
  projectUrl: null,
  publishedAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  featuredOnHomepage: false,
  featuredImage: null,
  results: [],
  relatedServices: [],
  seo: null,
};

const service: ServiceOffering = {
  id: "1",
  slug: "aeo-seo",
  title: "AEO & SEO",
  summary: "  <p>Rank higher &amp; get cited.</p>  ",
  content: "<p>Body</p>",
  publishedAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  icon: null,
  featuredImage: null,
  order: 1,
  features: ["On-page SEO", "Technical audits"],
  seo: null,
};

describe("buildOrganizationJsonLd", () => {
  test("carries a stable @id other nodes can reference", () => {
    const org = buildOrganizationJsonLd();
    assert.equal(org["@id"], ORG_ID);
    assert.equal(org["@type"], "Organization");
  });

  test("includes both founders", () => {
    const org = buildOrganizationJsonLd();
    assert.deepEqual(org.founder, [
      {
        "@type": "Person",
        name: "Raju Gorai",
        jobTitle: "Founder & Performance Marketing Specialist",
      },
      {
        "@type": "Person",
        name: "Kanchan Rana",
        jobTitle: "Founder & SEO Strategist",
      },
    ]);
  });
});

describe("buildServiceJsonLd", () => {
  test("builds a Service node keyed off the canonical URL, referencing the Organization by @id", () => {
    const canonicalUrl = `${siteConfig.url}/services/aeo-seo`;
    const result = buildServiceJsonLd(service, canonicalUrl);

    assert.equal(result["@type"], "Service");
    assert.equal(result["@id"], `${canonicalUrl}#service`);
    assert.equal(result.name, "AEO & SEO");
    assert.equal(result.url, canonicalUrl);
    assert.equal(result.description, "Rank higher & get cited.");
    assert.equal(result.serviceType, "AEO & SEO");
    assert.deepEqual(result.provider, { "@id": ORG_ID });
    assert.equal(result.areaServed, "Worldwide");
  });
});

describe("buildBlogPostingJsonLd publisher (JSONLD-1)", () => {
  test("references the Organization by @id instead of embedding a full duplicate", () => {
    const result = buildBlogPostingJsonLd(post, `${siteConfig.url}/blog/test-post`);
    assert.deepEqual(result.publisher, { "@id": ORG_ID });
  });
});

describe("buildCaseStudyJsonLd publisher (JSONLD-1)", () => {
  test("references the Organization by @id instead of embedding a full duplicate", () => {
    const result = buildCaseStudyJsonLd(
      caseStudy,
      `${siteConfig.url}/case-studies/test-case-study`,
    );
    assert.deepEqual(result.publisher, { "@id": ORG_ID });
  });
});
