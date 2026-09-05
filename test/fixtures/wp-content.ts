// Shared WordPress-shaped fixtures for tests that drive real production
// modules (adapters, repositories, route handlers). Shapes follow the
// src/types/api interfaces and pass the src/schemas/api Zod schemas, so a
// fixture drifting from the real API contract fails typecheck or the
// boundary parse rather than silently passing.
import type { WPCaseStudy } from "@/types/api/wp-case-study";
import type { WPPost } from "@/types/api/wp-post";
import type { WPServiceOffering } from "@/types/api/wp-service-offering";
import type { WPCategory, WPTag } from "@/types/api/wp-taxonomy";
import type { WPPage } from "@/types/api/wp-page";

export const wpServiceOfferingFixture: WPServiceOffering = {
  id: "c2VydmljZTox",
  slug: "search-engine-optimization",
  title: "Search Engine Optimization",
  content: null,
  date: "2026-07-01T09:00:00",
  modified: "2026-07-02T09:00:00",
  featuredImage: null,
  serviceFields: {
    shortDescription: "Rank higher.",
    description: "<p>Full service description.</p>",
    displayOrder: 1,
    features: "Technical SEO\r\nOn-Page SEO\r\nLocal SEO",
    icon: null,
  },
  seo: null,
};

export const wpCaseStudyFixture: WPCaseStudy = {
  id: "Y2FzZTox",
  slug: "stabilizing-and-scaling-seo",
  title: "Stabilizing and Scaling SEO",
  excerpt: "<p>Excerpt &amp; more.</p>",
  content: "<p>Full write-up.</p>",
  date: "2026-08-10T08:00:00",
  modified: "2026-08-11T08:00:00",
  featuredImage: {
    node: {
      id: "bWVkaWE6MQ==",
      sourceUrl: "https://cms.example.test/wp-content/uploads/hero.jpg",
      altText: "Hero",
      mediaDetails: { width: 1600, height: 900 },
    },
  },
  caseStudyFields: {
    clientName: "ChicaBebo",
    industry: "Ecommerce",
    projectUrl: "https://chicabebo.nl",
    shortSummary: "Short summary.",
    challenge: "<p>The challenge.</p>",
    solution: "<p>The solution.</p>",
    result1Label: "Traffic",
    result1Value: "+120%",
    result2Label: "Revenue",
    result2Value: null,
    result3Label: null,
    result3Value: "+5%",
    result4Label: "Rankings",
    result4Value: "Top 3",
    featuredOnHomepage: true,
    relatedServices: { nodes: [wpServiceOfferingFixture] },
  },
  seo: null,
};

export const wpPostFixture: WPPost = {
  id: "cG9zdDox",
  databaseId: 147,
  slug: "seo-for-small-businesses",
  title: "SEO for Small Businesses",
  excerpt: "<p>Don&#8217;t guess &amp; hope.</p>\n",
  content:
    '<h2 class="wp-block-heading">Intro</h2><p>Body &amp; text.</p>' +
    '<script>alert(document.cookie)</script><img src="https://cms.example.test/a.png" onerror="alert(1)">',
  date: "2026-08-01T10:00:00",
  modified: "2026-08-02T10:00:00",
  featuredImage: null,
  author: null,
  categories: null,
  tags: null,
  seo: null,
};

export const wpCategoryFixture: WPCategory = {
  id: "dGVybTox",
  name: "SEO",
  slug: "seo",
  count: 1,
};

export const wpTagFixture: WPTag = {
  id: "dGVybToy",
  name: "Local SEO",
  slug: "local-seo",
};

export const wpPageFixture: WPPage = {
  id: "cGFnZTox",
  slug: "about",
  title: "About",
  content: "<p>About us.</p>",
  featuredImage: null,
  seo: null,
};
