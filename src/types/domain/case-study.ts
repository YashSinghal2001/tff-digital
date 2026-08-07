import type { Media } from "@/types/domain/media";
import type { Seo } from "@/types/domain/seo";
import type { ServiceOffering } from "@/types/domain/service-offering";

export interface CaseStudyResult {
  label: string;
  value: string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  publishedAt: string;
  updatedAt: string;
  clientName: string;
  industry: string;
  projectUrl: string | null;
  summary: string;
  challenge: string;
  solution: string;
  // ACF Repeater is unavailable on this WordPress installation, so WP
  // exposes four fixed label/value field pairs (result1Label..result4Value)
  // instead of a true repeater. The adapter normalizes them into this array
  // (0-4 entries, pairs with a missing label or value are dropped) so
  // consumers see the same shape a real repeater would have produced.
  results: CaseStudyResult[];
  featuredOnHomepage: boolean;
  featuredImage: Media | null;
  relatedServices: ServiceOffering[];
  seo: Seo | null;
}
