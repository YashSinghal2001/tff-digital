import { siteConfig } from "@/config/site.config";
import { SOCIAL_LINKS } from "@/constants/social";
import { stripHtml } from "@/lib/content/post-content";
import type { Post } from "@/types/domain/post";
import type { CaseStudy } from "@/types/domain/case-study";
import type { ServiceOffering } from "@/types/domain/service-offering";

// Same treatment as the <meta description> fallback in src/adapters/seo.adapter.ts:
// structured-data text fields must be plain text, and stripping HTML tags alone
// can leave stray whitespace where the tags used to be.
function cleanText(raw: string): string {
  return stripHtml(raw).replace(/\s+/g, " ").trim();
}

// Single canonical business-identity node, referenced everywhere else by
// @id (WebSite.publisher, Service.provider, ...) — never re-embedded.
// @type is ProfessionalService (a schema.org LocalBusiness/Organization
// subtype) per the client-supplied target schema; the @id stays
// "#organization" since every other node's @id-reference already points at
// that string and renaming it would break those references for no benefit.
export function buildProfessionalServiceJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    alternateName: "TFF Digital Growth Agency",
    url: `${siteConfig.url}/`,
    // Served from /public.
    logo: `${siteConfig.url}/logo.png`,
    image: `${siteConfig.url}/og-image.png`,
    slogan: "Target Right. Find Strategy. Finish Strong.",
    description:
      "TFF Digital is a strategy-led digital growth agency driving measurable growth through SEO/AEO, social media marketing, Meta ads, web development, video editing, and ZOHO One implementation.",
    // Matches the contact details already public on /contact, the footer,
    // and the legal pages (Footer.tsx, ContactFormSection.tsx).
    email: "info@tffdigital.com",
    telephone: "+91-72068-09816",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Zirakpur",
      addressRegion: "Punjab",
      addressCountry: "IN",
    },
    sameAs: Object.values(SOCIAL_LINKS),
    // Full legal names per src/data/team.ts (id: "raju" / "kanchan").
    founder: [
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
    ],
    areaServed: "Worldwide",
  };
}

export function buildWebsiteJsonLd(): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteConfig.url}/#website`,
    name: siteConfig.name,
    url: `${siteConfig.url}/`,
    publisher: { "@id": `${siteConfig.url}/#organization` },
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
    // A bare @id reference, not the full buildProfessionalServiceJsonLd()
    // body — the root layout already emits the complete node on every page
    // (see src/app/layout.tsx), and Google merges nodes sharing an @id.
    // Repeating the full object here duplicated it (name/url/logo/sameAs) on
    // every single blog post; buildWebsiteJsonLd already used this reference
    // form, this just matches it.
    publisher: { "@id": `${siteConfig.url}/#organization` },
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
    // Bare @id reference — see the matching comment in buildBlogPostingJsonLd.
    publisher: { "@id": `${siteConfig.url}/#organization` },
  };
}

// Per-service description/serviceType supplied by the client's target-state
// schema (Schema/{AEO SEO,SMM,Meta Ads,Web Dev,VEditing}.txt,
// Schema/08-zoho-one.html) — richer than today's CMS `summary` field and not
// derivable from any CMS field, so it's held here rather than invented or
// forced through `service.summary`. A slug not in this map (a future service
// the client hasn't supplied a schema for yet) falls back to CMS-derived
// values, same as before this map existed.
const SERVICE_JSONLD_OVERRIDES: Record<string, { description: string; serviceType: string }> = {
  "aeo-seo": {
    description:
      "Our AEO & SEO services help your business become more visible across search engines and AI-powered search experiences. We combine technical SEO, content strategy, on-page optimization, local search, and Answer Engine Optimization to help your brand appear when potential customers are actively looking for your products or services.",
    serviceType: "Search Engine Optimization & Answer Engine Optimization",
  },
  smm: {
    description:
      "Our Social Media Marketing services help businesses build a strong and consistent presence across the platforms that matter to their audience. We combine content strategy, creative direction, platform optimization, and audience-focused storytelling to make your brand more recognizable and relevant.",
    serviceType: "Social Media Marketing",
  },
  "meta-ads": {
    description:
      "Our Meta Ads services help businesses reach the right people through strategically planned advertising campaigns across Facebook and Instagram. We build campaigns around your business objectives, audience, offer, and customer journey.",
    serviceType: "Paid Social Media Advertising",
  },
  "web-development": {
    description:
      "We build modern websites that combine strong design, performance, usability, and business strategy. Whether you need a high-converting business website, a professional service website, or a custom digital experience, we focus on creating websites built around your customers and business objectives.",
    serviceType: "Web Design & Development",
  },
  "video-editing": {
    description:
      "Our Video Editing services turn raw footage and ideas into engaging content built for today's digital platforms. We focus on strong hooks, clean storytelling, dynamic pacing, subtitles, visual elements, and platform-friendly formats to keep viewers engaged.",
    serviceType: "Video Production & Editing",
  },
  "zoho-one": {
    description:
      "Our ZOHO One services help businesses bring their essential operations into one connected ecosystem. We help businesses structure and connect their workflows across sales, marketing, customer management, finance, support, and operations.",
    serviceType: "Business Process Automation & CRM Implementation",
  },
};

export function buildServiceJsonLd(
  service: ServiceOffering,
  canonicalUrl: string,
): Record<string, unknown> {
  const override = SERVICE_JSONLD_OVERRIDES[service.slug];
  const node: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${canonicalUrl}#service`,
    name: service.title,
    url: canonicalUrl,
    description: override ? override.description : cleanText(service.summary),
    serviceType: override ? override.serviceType : service.title,
    // Bare @id reference — see the matching comment on buildBlogPostingJsonLd.
    provider: { "@id": `${siteConfig.url}/#organization` },
    areaServed: "Worldwide",
  };

  // The client schema's OfferCatalog item names match the CMS `features`
  // list 1:1 for every currently-published service, so it's generated from
  // that live data rather than duplicated as a second hardcoded copy —
  // omitted entirely (not emitted empty) when a service has no features yet.
  if (service.features.length > 0) {
    node.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: `${service.title} — What's Included`,
      itemListElement: service.features.map((feature) => ({
        "@type": "Offer",
        itemOffered: { "@type": "Service", name: cleanText(feature) },
      })),
    };
  }

  return node;
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

export interface FaqEntry {
  question: string;
  answer: string;
}

export function buildFaqJsonLd(items: FaqEntry[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

export interface ServiceListEntry {
  name: string;
  url: string;
  description: string;
}

// Lightweight sibling of buildServiceJsonLd for the /services listing: a
// bare-Service ItemList (name/url/description/provider only — no @id,
// serviceType, or hasOfferCatalog), matching the client's Services schema.
// Deliberately does NOT call buildServiceJsonLd, so a service's full
// OfferCatalog/FAQ data never leaks onto the listing page.
export function buildServiceListJsonLd(items: ServiceListEntry[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "TFF Digital Services",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Service",
        name: item.name,
        url: item.url,
        description: cleanText(item.description),
        provider: { "@id": `${siteConfig.url}/#organization` },
      },
    })),
  };
}
