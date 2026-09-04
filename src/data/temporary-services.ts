// ============================================================================
// TEMPORARY: WordPress "What We Do" / services-grid content disabled for UI
// development — the WordPress `services` CPT still holds placeholder entries
// ("AI Consulting Updated", "Web Development 2", …), so both the homepage
// cards (src/sections/home/WhatWeDo.tsx) and the /services grid
// (src/app/services/page.tsx) render these real TFF disciplines instead.
//
// TODO: RESTORE WORDPRESS DATA
// Once real services exist in WordPress: delete this file and restore the
// getServiceOfferings() fetches in src/app/page.tsx and
// src/app/services/page.tsx (both restore paths are commented in place).
// WordPress integration has intentionally NOT been deleted.
// ============================================================================
import { ROUTES } from "@/constants/routes";
import type { ServiceOffering } from "@/types/domain/service-offering";

export type TemporaryService = Pick<
  ServiceOffering,
  "id" | "slug" | "title" | "summary"
> & {
  features: string[];
  /**
   * Detail page for the discipline. `null` while it has no live page — the
   * matching WordPress slugs don't exist yet, so linking to
   * /services/<slug> would 404 (verified live 2026-08-20).
   */
  href: string | null;
};

export const temporaryServices: TemporaryService[] = [
  {
    id: "temp-aeo-seo",
    slug: "seo",
    title: "AEO & SEO Services",
    summary: "Get found. Build authority. Drive organic growth.",
    features: ["Answer Engine Optimization", "Technical SEO", "Organic Growth"],
    href: ROUTES.service("seo"),
  },
  {
    id: "temp-smm",
    slug: "smm",
    title: "SMM Services",
    summary: "Build brand love. Grow your community.",
    features: ["Content Strategy", "Engagement Growth", "Social Visibility"],
    href: ROUTES.service("smm"),
  },
  {
    id: "temp-meta-ads",
    slug: "google-meta-ads",
    title: "Meta Ads",
    summary: "Reach the right people. Turn clicks into customers.",
    features: ["Targeted Campaigns", "Lower CPA", "Higher ROI"],
    href: null,
  },
  {
    id: "temp-web-dev",
    slug: "web-development",
    title: "Web Development",
    summary: "Fast. Modern. Conversion focused websites.",
    features: ["SEO-Friendly Structure", "Mobile Responsive", "Better User Experience"],
    href: null,
  },
  {
    id: "temp-video-editing",
    slug: "video-editing",
    title: "Video Editing",
    summary: "Create scroll-stopping content that converts.",
    features: ["Engaging Visuals", "Social Ready Videos", "Brand Storytelling"],
    href: null,
  },
  {
    id: "temp-zoho-one",
    slug: "zoho-one",
    title: "ZOHO One",
    summary: "One platform. Every business tool you need to grow.",
    features: [
      "Unified Business Suite",
      "CRM & Workflow Automation",
      "Setup, Migration & Support",
    ],
    href: null,
  },
];
