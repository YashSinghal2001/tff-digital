import { ROUTES } from "@/constants/routes";

export interface FooterLink {
  label: string;
  href: string;
}

/**
 * Footer "Services" column. The footer is a static client component with no
 * CMS data, so this list is a hand-maintained mirror of the six WordPress
 * services (CMS titles and slugs are the source of truth — ARCH-1). Every
 * entry links its /services/{slug} detail page; nothing here may point at a
 * retired bespoke route such as /services/seo.
 */
export const FOOTER_SERVICE_LINKS: readonly FooterLink[] = [
  { label: "AEO & SEO", href: ROUTES.service("aeo-seo") },
  { label: "SMM", href: ROUTES.service("smm") },
  { label: "Meta Ads", href: ROUTES.service("meta-ads") },
  { label: "Web Development", href: ROUTES.service("web-development") },
  { label: "Video Editing", href: ROUTES.service("video-editing") },
  { label: "ZOHO One", href: ROUTES.service("zoho-one") },
];

export const FOOTER_QUICK_LINKS: readonly FooterLink[] = [
  { label: "Home", href: ROUTES.home },
  { label: "About us", href: ROUTES.about },
  { label: "Services", href: ROUTES.services },
  { label: "Testimonials", href: `${ROUTES.home}#testimonials` },
  { label: "Blog", href: ROUTES.blog },
  { label: "Contact us", href: ROUTES.contact },
];
