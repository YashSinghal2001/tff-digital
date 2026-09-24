import { ROUTES } from "@/constants/routes";

/**
 * Client-approved homepage copy ("TFF Digital Homepage .pdf", 4 pages),
 * rendered only on the /home-preview staging route. Verbatim from the PDF —
 * including its known wording anomalies ("Explore us", "Visit us", "Browse
 * us"), which are preserved on purpose pending client review. Do not
 * paraphrase or "fix" copy here without client sign-off. The PDF's
 * PLACEMENT notes and FAQ Internal-Linking Plan are implementation
 * instructions, not website copy, and deliberately do not appear here.
 */

/** A run of plain text, or an internal link with the PDF's exact anchor text. */
export type RichTextPart = string | { text: string; href: string };

export const homePreviewHero = {
  headline: "Digital Marketing Growth Agency Built for",
  headlineEmphasis: "Measurable Growth",
  intro:
    "TFF Digital connects strategy, creative execution, and performance marketing in one practical growth system. As a digital growth marketing agency, we help ambitious businesses find the right audience, improve customer touchpoints, and turn marketing activity into measurable progress. Start with a free consultation and leave with a clear next step.",
};

export const homePreviewWhatWeDo = {
  heading: "A Full Growth Stack",
  headingEmphasis: "Under One Roof",
};

/** Keyed by the live WordPress service slug; the card links stay WP-driven. */
export const homePreviewServiceCopy: Record<
  string,
  { title: string; summary: string }
> = {
  "aeo-seo": {
    title: "AEO and SEO",
    summary:
      "Build lasting visibility across traditional search and AI-led discovery with technical improvements, useful content and authority development.",
  },
  smm: {
    title: "Social Media Marketing",
    summary:
      "Create a recognizable brand, publish with purpose and turn attention into conversations, enquiries and loyal customers.",
  },
  "meta-ads": {
    title: "Meta Ads",
    summary:
      "Reach relevant audiences with campaigns shaped around your offer, funnel and commercial goals, then improve performance through ongoing testing.",
  },
  "web-development": {
    title: "Web Development",
    summary:
      "Launch a fast, credible and conversion-focused website that supports your brand and makes it easier for visitors to act.",
  },
  "video-editing": {
    title: "Video Editing",
    summary:
      "Transform ideas and raw footage into clear, engaging videos designed for modern platforms and shorter attention spans.",
  },
  "zoho-one": {
    title: "Zoho One",
    summary:
      "Connect sales, marketing and operations so your team can manage leads, customer relationships and everyday work more efficiently.",
  },
};

export const homePreviewComparison = {
  heading: "The Difference Is",
  headingEmphasis: "Strategy",
  intro:
    "TFF Digital is a digital marketing services agency for teams that want joined-up thinking rather than disconnected tasks. We begin by understanding the business, market, and customer journey. That insight shapes priorities, messaging, channels and measurement, giving every campaign a reason to exist and every decision in a commercial context.",
};

export const homePreviewProcess = {
  heading: "A",
  headingEmphasis: "Six-Step",
  headingTail: "Growth Engine",
  intro:
    "We discover what is holding growth back, research the market, build a focused strategy, design the required experiences, launch with tracking in place and scale what proves effective. This process keeps creative, technology, and performance moving in the same direction.",
};

export const homePreviewFounders = {
  heading: "Built by",
  headingEmphasis: "Experienced Growth Leaders",
  intro: [
    "TFF Digital is led by specialists in performance marketing, PPC, SEO, content, and organic growth. Explore us ",
    { text: "case studies", href: ROUTES.caseStudies },
    " to see how structured optimization has supported real businesses.",
  ] satisfies RichTextPart[],
};

/**
 * Each excerpt is pinned to the verified Upwork review (src/data/testimonials.ts)
 * it was drawn from; a test fails if the source review stops containing it.
 */
export const homePreviewTestimonials = {
  heading: "What Clients",
  headingEmphasis: "Say",
  excerpts: [
    {
      quote:
        "Very dedicated, professional and always available to help resolve issues quickly.",
      testimonialId: "on-page-seo-cleanup-wordpress",
    },
    {
      quote: "Helpful, punctual and professional.",
      testimonialId: "google-ads-specialist",
    },
    {
      quote: "Systematic and thorough in her approach.",
      testimonialId: "seo-principles-website-rankings",
    },
  ],
  caption:
    "Feedback from verified Upwork projects displayed on the TFF Digital homepage.",
};

export const homePreviewFit = {
  heading: "Is TFF Digital Right for You?",
  intro:
    "We work best with teams that value senior guidance, realistic expectations, and sustained improvement. If you want a digital marketing company that measures progress against meaningful business outcomes rather than vanity metrics, let us identify the highest-leverage opportunity first.",
};

export const homePreviewFaq: {
  heading: string;
  headingEmphasis: string;
  items: Array<{ question: string; answer: RichTextPart[] }>;
} = {
  heading: "Questions,",
  headingEmphasis: "Answered",
  items: [
    {
      question:
        "What makes TFF Digital different from another digital marketing agency?",
      answer: [
        "We combine strategy, branding, acquisition, conversion, and technology within one accountable team. Learn more about our approach and people on the ",
        { text: "About page", href: ROUTES.about },
        ".",
      ],
    },
    {
      question: "Which digital marketing services can you manage?",
      answer: [
        "Our services include AEO and SEO, social media marketing, Meta Ads, web development, video editing, and Zoho One implementation. Explore all ",
        { text: "digital marketing services", href: ROUTES.services },
        " to choose the right starting point.",
      ],
    },
    {
      question: "Can you help improve organic visibility?",
      answer: [
        "Yes. Our ",
        { text: "AEO and SEO service", href: ROUTES.service("aeo-seo") },
        " covers technical foundations, content and authority, with strategies designed for search engines and AI discovery.",
      ],
    },
    {
      question: "Do you manage social media marketing?",
      answer: [
        "Yes. Our ",
        { text: "social media marketing service", href: ROUTES.service("smm") },
        " helps businesses build a recognizable presence, engage the right audience and connect content activity with wider growth goals.",
      ],
    },
    {
      question: "Do you work with paid social campaigns?",
      answer: [
        "Yes. Visit us ",
        { text: "Meta Ads service", href: ROUTES.service("meta-ads") },
        " to see how audience strategy, creative testing, and performance optimization work together.",
      ],
    },
    {
      question: "Can you build or improve our website?",
      answer: [
        "Yes. Our ",
        {
          text: "web development service",
          href: ROUTES.service("web-development"),
        },
        " focuses on design, performance, usability and conversion, so the website supports both credibility and growth.",
      ],
    },
    {
      question: "Can I review examples before booking?",
      answer: [
        "Yes. Browse us ",
        { text: "case studies", href: ROUTES.caseStudies },
        " for examples of structured SEO and growth work, then book a consultation through the ",
        { text: "Contact page", href: ROUTES.contact },
        ".",
      ],
    },
  ],
};

export const homePreviewFinalCta = {
  heading: "Turn Your Next Step into a",
  headingEmphasis: "Growth System",
  intro:
    "Bring the business challenge, even if you do not yet know which service you need. We will identify the most important gap, explain the practical options, and recommend a focused next step without unnecessary upselling.",
};

/** Flattens rich text to its visible string. */
export function richTextToPlain(parts: readonly RichTextPart[]): string {
  return parts
    .map((part) => (typeof part === "string" ? part : part.text))
    .join("");
}
