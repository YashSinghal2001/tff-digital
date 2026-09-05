export const ROUTES = {
  home: "/",
  about: "/about",
  services: "/services",
  service: (slug: string) => `/services/${slug}`,
  caseStudies: "/case-studies",
  caseStudy: (slug: string) => `/case-studies/${slug}`,
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  blogCategory: (slug: string) => `/blog/category/${slug}`,
  blogTag: (slug: string) => `/blog/tag/${slug}`,
  contact: "/contact",
  thankYou: "/thank-you",
  privacyPolicy: "/privacy-policy",
  termsAndConditions: "/terms-and-conditions",
  cookiePolicy: "/cookie-policy",
  // Generic WordPress "Page" (CLIENT-1). Root-level, no prefix segment —
  // matches WordPress's own default Page permalink shape and keeps a
  // client's expectation ("create a Page, it's live at that slug") intact.
  // Safe from colliding with every route above: src/app/[slug]/page.tsx
  // never wins against a same-name static folder (Next's own routing
  // precedence), and src/lib/content/reserved-page-slugs.ts additionally
  // keeps those exact slugs out of generateStaticParams and the sitemap.
  page: (slug: string) => `/${slug}`,
} as const;
