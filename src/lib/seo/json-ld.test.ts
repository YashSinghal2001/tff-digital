import assert from "node:assert/strict";
import test, { describe } from "node:test";
import {
  buildProfessionalServiceJsonLd,
  buildWebsiteJsonLd,
  buildBlogPostingJsonLd,
  buildCaseStudyJsonLd,
  buildServiceJsonLd,
  buildFaqJsonLd,
  buildServiceListJsonLd,
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

const overriddenService: ServiceOffering = {
  id: "1",
  slug: "aeo-seo",
  title: "AEO & SEO",
  summary: "  <p>Rank higher &amp; get cited.</p>  ",
  content: "<p>Body</p>",
  customHtmlContent: "",
  publishedAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  icon: null,
  featuredImage: null,
  order: 1,
  features: ["On-page SEO", "Technical audits"],
  faqs: [],
  seo: null,
};

const unmappedService: ServiceOffering = {
  ...overriddenService,
  id: "2",
  slug: "brand-strategy",
  title: "Brand Strategy",
  features: [],
};

describe("buildProfessionalServiceJsonLd", () => {
  test("carries a stable @id other nodes can reference", () => {
    const org = buildProfessionalServiceJsonLd();
    assert.equal(org["@id"], ORG_ID);
    assert.equal(org["@type"], "ProfessionalService");
  });

  test("includes the client-supplied identity fields", () => {
    const org = buildProfessionalServiceJsonLd();
    assert.equal(org.alternateName, "TFF Digital Growth Agency");
    assert.equal(org.url, `${siteConfig.url}/`);
    assert.equal(org.logo, `${siteConfig.url}/logo.png`);
    assert.equal(org.image, `${siteConfig.url}/og-image.png`);
    assert.equal(org.slogan, "Target Right. Find Strategy. Finish Strong.");
    assert.equal(org.email, "info@tffdigital.com");
    assert.equal(org.telephone, "+91-72068-09816");
    assert.deepEqual(org.address, {
      "@type": "PostalAddress",
      addressLocality: "Zirakpur",
      addressRegion: "Punjab",
      addressCountry: "IN",
    });
    assert.equal(org.areaServed, "Worldwide");
  });

  test("sameAs includes the Upwork profile", () => {
    const org = buildProfessionalServiceJsonLd();
    assert.ok((org.sameAs as string[]).includes("https://www.upwork.com/freelancers/upworkseoexpert"));
  });

  test("includes both founders", () => {
    const org = buildProfessionalServiceJsonLd();
    assert.deepEqual(org.founder, [
      {
        "@type": "Person",
        name: "Raju Gorai",
        jobTitle: "Co-Founder, Performance Marketing Expert",
      },
      {
        "@type": "Person",
        name: "Kanchan Rana",
        jobTitle: "Co-Founder, SEO & Organic Growth Expert",
      },
    ]);
  });
});

describe("buildWebsiteJsonLd", () => {
  test("carries its own @id and a trailing-slash root URL", () => {
    const site = buildWebsiteJsonLd();
    assert.equal(site["@id"], `${siteConfig.url}/#website`);
    assert.equal(site.url, `${siteConfig.url}/`);
    assert.deepEqual(site.publisher, { "@id": ORG_ID });
  });
});

describe("buildServiceJsonLd", () => {
  test("uses the client-supplied description/serviceType/OfferCatalog for a mapped slug", () => {
    const canonicalUrl = `${siteConfig.url}/services/aeo-seo`;
    const result = buildServiceJsonLd(overriddenService, canonicalUrl);

    assert.equal(result["@type"], "Service");
    assert.equal(result["@id"], `${canonicalUrl}#service`);
    assert.equal(result.name, "AEO & SEO");
    assert.equal(result.url, canonicalUrl);
    assert.equal(
      result.description,
      "Our AEO & SEO services help your business become more visible across search engines and AI-powered search experiences. We combine technical SEO, content strategy, on-page optimization, local search, and Answer Engine Optimization to help your brand appear when potential customers are actively looking for your products or services.",
    );
    assert.equal(result.serviceType, "Search Engine Optimization & Answer Engine Optimization");
    assert.deepEqual(result.provider, { "@id": ORG_ID });
    assert.equal(result.areaServed, "Worldwide");
    assert.deepEqual(result.hasOfferCatalog, {
      "@type": "OfferCatalog",
      name: "AEO & SEO — What's Included",
      itemListElement: [
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "On-page SEO" } },
        { "@type": "Offer", itemOffered: { "@type": "Service", name: "Technical audits" } },
      ],
    });
  });

  test("falls back to CMS-derived description/serviceType and omits hasOfferCatalog for an unmapped slug with no features", () => {
    const canonicalUrl = `${siteConfig.url}/services/brand-strategy`;
    const result = buildServiceJsonLd(unmappedService, canonicalUrl);

    assert.equal(result.description, "Rank higher & get cited.");
    assert.equal(result.serviceType, "Brand Strategy");
    assert.equal(result.hasOfferCatalog, undefined);
  });
});

describe("buildFaqJsonLd", () => {
  test("builds a FAQPage with one Question per supplied item", () => {
    const result = buildFaqJsonLd([
      { question: "Q1", answer: "A1" },
      { question: "Q2", answer: "A2" },
    ]);

    assert.equal(result["@type"], "FAQPage");
    assert.deepEqual(result.mainEntity, [
      { "@type": "Question", name: "Q1", acceptedAnswer: { "@type": "Answer", text: "A1" } },
      { "@type": "Question", name: "Q2", acceptedAnswer: { "@type": "Answer", text: "A2" } },
    ]);
  });
});

describe("buildServiceListJsonLd", () => {
  test("builds a bare-Service ItemList without @id, serviceType, or hasOfferCatalog", () => {
    const result = buildServiceListJsonLd([
      { name: "AEO & SEO", url: `${siteConfig.url}/services/aeo-seo`, description: "  Get found.  " },
    ]);

    assert.equal(result["@type"], "ItemList");
    assert.deepEqual(result.itemListElement, [
      {
        "@type": "ListItem",
        position: 1,
        item: {
          "@type": "Service",
          name: "AEO & SEO",
          url: `${siteConfig.url}/services/aeo-seo`,
          description: "Get found.",
          provider: { "@id": ORG_ID },
        },
      },
    ]);
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
