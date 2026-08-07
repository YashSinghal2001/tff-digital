import { siteConfig } from "@/config/site.config";
import { stripHtml } from "@/lib/content/post-content";
import type { Post } from "@/types/domain/post";
import type { CaseStudy } from "@/types/domain/case-study";

// Same treatment as the <meta description> fallback in src/adapters/seo.adapter.ts:
// structured-data text fields must be plain text, and stripping HTML tags alone
// can leave stray whitespace where the tags used to be.
function cleanText(raw: string): string {
  return stripHtml(raw).replace(/\s+/g, " ").trim();
}

export function buildOrganizationJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
  };
}

export function buildWebsiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
  };
}

export function buildBlogPostingJsonLd(
  post: Post,
  canonicalUrl: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": canonicalUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    headline: post.title,
    // Structured-data text fields must be plain text — WP excerpts can carry
    // raw HTML (e.g. "<p>...</p>"), same class of issue already handled for
    // the <meta description> tag in src/adapters/seo.adapter.ts.
    description: post.excerpt ? cleanText(post.excerpt) : undefined,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    image: post.featuredImage?.url
      ? { "@type": "ImageObject", url: post.featuredImage.url }
      : undefined,
    author: post.author
      ? { "@type": "Person", name: post.author.name }
      : undefined,
    publisher: buildOrganizationJsonLd(),
  };
}

export function buildCaseStudyJsonLd(
  caseStudy: CaseStudy,
  canonicalUrl: string,
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    "@id": canonicalUrl,
    mainEntityOfPage: { "@type": "WebPage", "@id": canonicalUrl },
    name: caseStudy.title,
    description: caseStudy.summary
      ? cleanText(caseStudy.summary)
      : caseStudy.excerpt
        ? cleanText(caseStudy.excerpt)
        : undefined,
    url: canonicalUrl,
    datePublished: caseStudy.publishedAt,
    dateModified: caseStudy.updatedAt,
    image: caseStudy.featuredImage?.url
      ? { "@type": "ImageObject", url: caseStudy.featuredImage.url }
      : undefined,
    about: caseStudy.clientName
      ? { "@type": "Organization", name: caseStudy.clientName }
      : undefined,
    additionalProperty:
      caseStudy.results.length > 0
        ? caseStudy.results.map((result) => ({
            "@type": "PropertyValue",
            name: result.label,
            value: result.value,
          }))
        : undefined,
    publisher: buildOrganizationJsonLd(),
  };
}

export interface BreadcrumbEntry {
  name: string;
  url: string;
}

export function buildBreadcrumbJsonLd(
  items: BreadcrumbEntry[],
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
